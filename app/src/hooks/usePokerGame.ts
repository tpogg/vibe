"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Idl, BN } from "@coral-xyz/anchor";
import { PROGRAM_ID } from "@/lib/constants";
import { GameTableAccount } from "@/types/poker";
import idl from "@/lib/idl.json";

export function usePokerGame() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [tables, setTables] = useState<{ address: string; account: GameTableAccount }[]>([]);
  const [loading, setLoading] = useState(false);

  const getProvider = useCallback(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) return null;
    return new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
  }, [connection, wallet]);

  const getProgram = useCallback(() => {
    const provider = getProvider();
    if (!provider) return null;
    return new Program(idl as unknown as Idl, provider);
  }, [getProvider]);

  // Fetch all game tables
  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
        commitment: "confirmed",
      });

      const program = getProgram();
      if (!program) {
        setLoading(false);
        return;
      }

      const parsed = await Promise.all(
        accounts.map(async ({ pubkey, account: accInfo }) => {
          try {
            const decoded = program.coder.accounts.decode("GameTable", accInfo.data);
            return {
              address: pubkey.toString(),
              account: decoded as GameTableAccount,
            };
          } catch {
            return null;
          }
        })
      );

      setTables(parsed.filter(Boolean) as typeof tables);
    } catch (err) {
      console.error("Failed to fetch tables:", err);
    }
    setLoading(false);
  }, [connection, getProgram]);

  // Fetch a single table
  const fetchTable = useCallback(
    async (address: string): Promise<GameTableAccount | null> => {
      const program = getProgram();
      if (!program) return null;
      try {
        const account = await (program.account as any)["gameTable"].fetch(new PublicKey(address));
        return account as unknown as GameTableAccount;
      } catch (err) {
        console.error("Failed to fetch table:", err);
        return null;
      }
    },
    [getProgram]
  );

  // Subscribe to table changes
  const subscribeTable = useCallback(
    (address: string, callback: (account: GameTableAccount) => void) => {
      const pubkey = new PublicKey(address);
      const program = getProgram();
      if (!program) return () => {};

      const id = connection.onAccountChange(pubkey, (accInfo) => {
        try {
          const decoded = program.coder.accounts.decode("GameTable", accInfo.data);
          callback(decoded as GameTableAccount);
        } catch (err) {
          console.error("Failed to decode table update:", err);
        }
      });

      return () => {
        connection.removeAccountChangeListener(id);
      };
    },
    [connection, getProgram]
  );

  // Auto-fetch tables on mount
  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [fetchTables]);

  return { tables, loading, fetchTables, fetchTable, subscribeTable, getProgram, getProvider };
}
