"use client";

import { useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, SYSVAR_SLOT_HASHES_PUBKEY } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getTablePDA } from "@/lib/anchor";
import { HOUSE_WALLET } from "@/lib/constants";
import { usePokerGame } from "./usePokerGame";

export function useGameActions() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { getProgram } = usePokerGame();

  const createTable = useCallback(
    async (maxPlayers: number, buyIn: number, isPrivate: boolean) => {
      const program = getProgram();
      if (!program || !wallet.publicKey) throw new Error("Wallet not connected");

      const tableId = new BN(Date.now());
      const tablePDA = getTablePDA(wallet.publicKey, BigInt(tableId.toString()));
      const inviteCode = isPrivate
        ? Array.from(crypto.getRandomValues(new Uint8Array(8)))
        : Array(8).fill(0);

      await program.methods
        .createTable(
          tableId,
          maxPlayers,
          new BN(buyIn),
          isPrivate,
          inviteCode,
          150, // 1.5% rake
          HOUSE_WALLET
        )
        .accounts({
          gameTable: tablePDA,
          creator: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tablePDA.toString();
    },
    [getProgram, wallet.publicKey]
  );

  const joinTable = useCallback(
    async (tableAddress: string, inviteCode?: number[]) => {
      const program = getProgram();
      if (!program || !wallet.publicKey) throw new Error("Wallet not connected");

      await program.methods
        .joinTable(inviteCode || null)
        .accounts({
          gameTable: new PublicKey(tableAddress),
          player: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    [getProgram, wallet.publicKey]
  );

  const leaveTable = useCallback(
    async (tableAddress: string) => {
      const program = getProgram();
      if (!program || !wallet.publicKey) throw new Error("Wallet not connected");

      await program.methods
        .leaveTable()
        .accounts({
          gameTable: new PublicKey(tableAddress),
          player: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    [getProgram, wallet.publicKey]
  );

  const startGame = useCallback(
    async (tableAddress: string) => {
      const program = getProgram();
      if (!program || !wallet.publicKey) throw new Error("Wallet not connected");

      await program.methods
        .startGame()
        .accounts({
          gameTable: new PublicKey(tableAddress),
          creator: wallet.publicKey,
          slotHashes: SYSVAR_SLOT_HASHES_PUBKEY,
        })
        .rpc();
    },
    [getProgram, wallet.publicKey]
  );

  const placeBet = useCallback(
    async (tableAddress: string, action: any) => {
      const program = getProgram();
      if (!program || !wallet.publicKey) throw new Error("Wallet not connected");

      await program.methods
        .placeBet(action)
        .accounts({
          gameTable: new PublicKey(tableAddress),
          player: wallet.publicKey,
        })
        .rpc();
    },
    [getProgram, wallet.publicKey]
  );

  const advancePhase = useCallback(
    async (tableAddress: string) => {
      const program = getProgram();
      if (!program || !wallet.publicKey) throw new Error("Wallet not connected");

      await program.methods
        .advancePhase()
        .accounts({
          gameTable: new PublicKey(tableAddress),
          caller: wallet.publicKey,
        })
        .rpc();
    },
    [getProgram, wallet.publicKey]
  );

  const settle = useCallback(
    async (tableAddress: string, houseWallet: PublicKey) => {
      const program = getProgram();
      if (!program || !wallet.publicKey) throw new Error("Wallet not connected");

      await program.methods
        .settle()
        .accounts({
          gameTable: new PublicKey(tableAddress),
          houseWallet,
          caller: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    [getProgram, wallet.publicKey]
  );

  return { createTable, joinTable, leaveTable, startGame, placeBet, advancePhase, settle };
}
