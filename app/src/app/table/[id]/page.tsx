"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { BN } from "@coral-xyz/anchor";
import { usePokerGame } from "@/hooks/usePokerGame";
import { useGameActions } from "@/hooks/useGameActions";
import { GameTableAccount, parseGamePhase } from "@/types/poker";
import PokerTable from "@/components/PokerTable";
import { randomWinEmoji } from "@/lib/constants";

export default function TablePage() {
  const params = useParams();
  const router = useRouter();
  const tableAddress = params.id as string;
  const { publicKey } = useWallet();
  const { fetchTable, subscribeTable } = usePokerGame();
  const { joinTable, startGame, placeBet, advancePhase, settle, leaveTable } = useGameActions();
  const [table, setTable] = useState<GameTableAccount | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial table state
  useEffect(() => {
    fetchTable(tableAddress).then((t) => {
      if (t) setTable(t);
      else setError("Table not found");
    });
  }, [tableAddress, fetchTable]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsub = subscribeTable(tableAddress, (updated) => {
      setTable(updated);
    });
    return unsub;
  }, [tableAddress, subscribeTable]);

  const isCreator = publicKey && table && table.creator.equals(publicKey);
  const isPlayer = publicKey && table?.players.some((p) => p.pubkey.equals(publicKey));
  const phase = table ? parseGamePhase(table.gamePhase) : "Waiting";

  const handleJoin = useCallback(async () => {
    try {
      await joinTable(tableAddress);
      const updated = await fetchTable(tableAddress);
      if (updated) setTable(updated);
    } catch (err: any) {
      setError(err.message);
    }
  }, [joinTable, tableAddress, fetchTable]);

  const handleLeave = useCallback(async () => {
    try {
      await leaveTable(tableAddress);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }
  }, [leaveTable, tableAddress, router]);

  const handleStart = useCallback(async () => {
    try {
      await startGame(tableAddress);
    } catch (err: any) {
      setError(err.message);
    }
  }, [startGame, tableAddress]);

  const handleBet = useCallback(
    async (action: any) => {
      try {
        await placeBet(tableAddress, action);
      } catch (err: any) {
        setError(err.message);
      }
    },
    [placeBet, tableAddress]
  );

  const handleAdvance = useCallback(async () => {
    try {
      await advancePhase(tableAddress);
    } catch (err: any) {
      setError(err.message);
    }
  }, [advancePhase, tableAddress]);

  const handleSettle = useCallback(async () => {
    if (!table) return;
    try {
      await settle(tableAddress, table.houseWallet);
      alert(`${randomWinEmoji()} Round settled!`);
    } catch (err: any) {
      setError(err.message);
    }
  }, [settle, tableAddress, table]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button onClick={() => router.push("/")} className="text-poker-gold hover:underline">
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 animate-pulse text-lg">Loading table...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/")} className="text-gray-400 hover:text-white">
            &larr; Lobby
          </button>
          <h1 className="text-xl font-bold text-white">
            Table #{table.tableId.toString()}
          </h1>
          <span className={`px-2 py-0.5 rounded text-xs ${
            phase === "Waiting" ? "bg-green-900/50 text-green-400" : "bg-yellow-900/50 text-yellow-400"
          }`}>
            {phase}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Game controls */}
          {phase === "Waiting" && !isPlayer && publicKey && (
            <button onClick={handleJoin} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold">
              Join Table
            </button>
          )}
          {phase === "Waiting" && isPlayer && (
            <button onClick={handleLeave} className="px-4 py-2 bg-red-600/50 hover:bg-red-600 text-white rounded-lg text-sm">
              Leave
            </button>
          )}
          {phase === "Waiting" && isCreator && table.players.length >= 2 && (
            <button onClick={handleStart} className="px-4 py-2 bg-poker-gold/20 hover:bg-poker-gold/30 text-poker-gold rounded-lg font-bold">
              Deal Cards!
            </button>
          )}
          {phase === "Showdown" && (
            <button onClick={handleSettle} className="px-4 py-2 bg-poker-gold hover:bg-yellow-500 text-black rounded-lg font-bold">
              Settle Round
            </button>
          )}
          {phase !== "Waiting" && phase !== "Showdown" && (
            <button onClick={handleAdvance} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">
              Next Phase
            </button>
          )}
          <WalletMultiButton />
        </div>
      </div>

      {/* Poker table */}
      <div className="flex-1">
        <PokerTable
          table={table}
          onFold={() => handleBet({ fold: {} })}
          onCheck={() => handleBet({ check: {} })}
          onCall={() => handleBet({ call: {} })}
          onRaise={(amount) => handleBet({ raise: { amount: new BN(amount) } })}
          onAllIn={() => handleBet({ allIn: {} })}
        />
      </div>
    </div>
  );
}
