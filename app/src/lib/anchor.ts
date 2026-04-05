import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { PROGRAM_ID, RPC_URL } from "./constants";
import idl from "./idl.json";

export function getConnection(): Connection {
  return new Connection(RPC_URL, "confirmed");
}

export function getProgram(provider: AnchorProvider): Program {
  return new Program(idl as unknown as Idl, provider);
}

export function getTablePDA(creator: PublicKey, tableId: bigint | number): PublicKey {
  const tableIdBuf = Buffer.alloc(8);
  tableIdBuf.writeBigUInt64LE(BigInt(tableId));

  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("table"), creator.toBuffer(), tableIdBuf],
    PROGRAM_ID
  );
  return pda;
}
