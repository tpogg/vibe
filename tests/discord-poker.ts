import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_SLOT_HASHES_PUBKEY, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

// IDL type — loaded by Anchor workspace
const idl = require("../target/idl/discord_poker.json");

describe("discord-poker", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const programId = new PublicKey(idl.metadata.address);
  const program = new Program(idl, programId, provider);

  const creator = provider.wallet;
  const player2 = Keypair.generate();
  const houseWallet = Keypair.generate();
  let tablePDA: PublicKey;
  let tableBump: number;
  const tableId = new anchor.BN(1);

  before(async () => {
    // Airdrop to player2
    const sig = await provider.connection.requestAirdrop(
      player2.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    // Derive table PDA
    const tableIdBuf = Buffer.alloc(8);
    tableIdBuf.writeBigUInt64LE(BigInt(1));
    [tablePDA, tableBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("table"), creator.publicKey.toBuffer(), tableIdBuf],
      programId
    );
  });

  it("Creates a poker table", async () => {
    const buyIn = new anchor.BN(0.1 * LAMPORTS_PER_SOL);

    await program.methods
      .createTable(
        tableId,
        6, // max players
        buyIn,
        false, // public
        Array(8).fill(0), // no invite code
        150, // 1.5% rake
        houseWallet.publicKey
      )
      .accounts({
        gameTable: tablePDA,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const table = await program.account.gameTable.fetch(tablePDA);
    assert.equal(table.tableId.toNumber(), 1);
    assert.equal(table.maxPlayers, 6);
    assert.equal(table.buyIn.toNumber(), buyIn.toNumber());
    assert.equal(table.players.length, 1); // creator auto-joins
    assert.equal(table.rakeBps, 150);
    assert.ok(table.creator.equals(creator.publicKey));
    console.log("  Table created with PDA:", tablePDA.toString());
  });

  it("Player 2 joins the table", async () => {
    await program.methods
      .joinTable(null) // no invite code
      .accounts({
        gameTable: tablePDA,
        player: player2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([player2])
      .rpc();

    const table = await program.account.gameTable.fetch(tablePDA);
    assert.equal(table.players.length, 2);
    assert.ok(table.players[1].pubkey.equals(player2.publicKey));
    console.log("  Player 2 joined:", player2.publicKey.toString().slice(0, 8) + "...");
  });

  it("Starts the game and deals cards", async () => {
    await program.methods
      .startGame()
      .accounts({
        gameTable: tablePDA,
        creator: creator.publicKey,
        slotHashes: SYSVAR_SLOT_HASHES_PUBKEY,
      })
      .rpc();

    const table = await program.account.gameTable.fetch(tablePDA);
    assert.ok("preFlop" in table.gamePhase);
    assert.notEqual(table.players[0].holeCards[0], 255);
    assert.notEqual(table.players[1].holeCards[0], 255);
    assert.ok(table.pot.toNumber() > 0); // blinds posted
    console.log("  Game started! Phase: PreFlop");
    console.log("  Player 1 cards:", table.players[0].holeCards);
    console.log("  Player 2 cards:", table.players[1].holeCards);
    console.log("  Pot after blinds:", table.pot.toNumber());
  });

  it("Players can place bets", async () => {
    const table = await program.account.gameTable.fetch(tablePDA);
    const currentPlayerKey = table.players[table.currentPlayer].pubkey;

    // Determine which signer to use
    const isCreatorTurn = currentPlayerKey.equals(creator.publicKey);
    const signers = isCreatorTurn ? [] : [player2];
    const playerAccount = isCreatorTurn ? creator.publicKey : player2.publicKey;

    // Call
    await program.methods
      .placeBet({ call: {} })
      .accounts({
        gameTable: tablePDA,
        player: playerAccount,
      })
      .signers(signers)
      .rpc();

    console.log("  Player called successfully");
  });

  it("Can check after calling", async () => {
    const table = await program.account.gameTable.fetch(tablePDA);
    const currentPlayerKey = table.players[table.currentPlayer].pubkey;
    const isCreatorTurn = currentPlayerKey.equals(creator.publicKey);
    const signers = isCreatorTurn ? [] : [player2];
    const playerAccount = isCreatorTurn ? creator.publicKey : player2.publicKey;

    // Check (or call if needed)
    const playerBet = table.players[table.currentPlayer].currentBet.toNumber();
    const tableBet = table.currentBet.toNumber();

    if (playerBet >= tableBet) {
      await program.methods
        .placeBet({ check: {} })
        .accounts({
          gameTable: tablePDA,
          player: playerAccount,
        })
        .signers(signers)
        .rpc();
      console.log("  Player checked");
    } else {
      await program.methods
        .placeBet({ call: {} })
        .accounts({
          gameTable: tablePDA,
          player: playerAccount,
        })
        .signers(signers)
        .rpc();
      console.log("  Player called");
    }
  });

  it("Advances to flop", async () => {
    await program.methods
      .advancePhase()
      .accounts({
        gameTable: tablePDA,
        caller: creator.publicKey,
      })
      .rpc();

    const table = await program.account.gameTable.fetch(tablePDA);
    assert.ok("flop" in table.gamePhase);
    assert.notEqual(table.communityCards[0], 255);
    assert.notEqual(table.communityCards[1], 255);
    assert.notEqual(table.communityCards[2], 255);
    console.log("  Flop dealt:", table.communityCards.slice(0, 3));
  });

  it("Full round through to showdown", async () => {
    // Both players check through flop, turn, river
    for (const phaseName of ["flop", "turn", "river"]) {
      // Two checks (one per player)
      for (let i = 0; i < 2; i++) {
        const table = await program.account.gameTable.fetch(tablePDA);
        const currentPlayerKey = table.players[table.currentPlayer].pubkey;
        const isCreatorTurn = currentPlayerKey.equals(creator.publicKey);

        await program.methods
          .placeBet({ check: {} })
          .accounts({
            gameTable: tablePDA,
            player: isCreatorTurn ? creator.publicKey : player2.publicKey,
          })
          .signers(isCreatorTurn ? [] : [player2])
          .rpc();
      }

      // Advance phase (unless we've gone past river to showdown)
      const tableAfter = await program.account.gameTable.fetch(tablePDA);
      if (!("showdown" in tableAfter.gamePhase)) {
        await program.methods
          .advancePhase()
          .accounts({
            gameTable: tablePDA,
            caller: creator.publicKey,
          })
          .rpc();
      }
    }

    const table = await program.account.gameTable.fetch(tablePDA);
    assert.ok("showdown" in table.gamePhase);
    console.log("  Reached showdown!");
    console.log("  Community cards:", table.communityCards);
    console.log("  Pot:", table.pot.toNumber());
  });

  it("Settles the round and collects rake", async () => {
    const houseBalanceBefore = await provider.connection.getBalance(houseWallet.publicKey);

    await program.methods
      .settle()
      .accounts({
        gameTable: tablePDA,
        houseWallet: houseWallet.publicKey,
        caller: creator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const table = await program.account.gameTable.fetch(tablePDA);
    assert.ok("waiting" in table.gamePhase);
    assert.equal(table.pot.toNumber(), 0);

    const houseBalanceAfter = await provider.connection.getBalance(houseWallet.publicKey);
    const rake = houseBalanceAfter - houseBalanceBefore;
    console.log("  Round settled!");
    console.log("  Rake collected:", rake, "lamports");
    console.log("  Game phase reset to Waiting");
    console.log("  Remaining players:", table.players.length);
  });
});
