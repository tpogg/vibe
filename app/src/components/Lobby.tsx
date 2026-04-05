"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, lamportsToSol } from "@/lib/constants";
import { GameTableAccount, parseGamePhase } from "@/types/poker";

interface LobbyProps {
  tables: { address: string; account: GameTableAccount }[];
  onCreateTable: (maxPlayers: number, buyIn: number, isPrivate: boolean) => void;
  onJoinTable: (tableAddress: string) => void;
  loading: boolean;
}

export default function Lobby({ tables, onCreateTable, onJoinTable, loading }: LobbyProps) {
  const { connected } = useWallet();
  const [showCreate, setShowCreate] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [buyIn, setBuyIn] = useState(0.1);
  const [isPrivate, setIsPrivate] = useState(false);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">
            ♠ DiscordPoker
          </h1>
          <p className="text-gray-400 mt-1">Decentralized Texas Hold&apos;em on Solana</p>
        </div>
        <div className="flex items-center gap-4">
          <a href="/leaderboard" className="text-poker-gold hover:underline text-sm">
            Leaderboard
          </a>
          <WalletMultiButton />
        </div>
      </div>

      {/* Create table */}
      {connected && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full py-3 bg-poker-gold/20 hover:bg-poker-gold/30 text-poker-gold rounded-lg font-bold transition-colors"
            >
              + Create New Table
            </button>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Create Table</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Max Players</label>
                  <select
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 mt-1"
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <option key={n} value={n}>{n} players</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Buy-in (SOL)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={buyIn}
                    onChange={(e) => setBuyIn(Number(e.target.value))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 mt-1"
                  />
                </div>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="accent-poker-gold"
                    />
                    Private
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onCreateTable(maxPlayers, buyIn * LAMPORTS_PER_SOL, isPrivate);
                    setShowCreate(false);
                  }}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors"
                >
                  Create & Join
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table list */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">
          Open Tables {loading && <span className="text-sm text-gray-400 animate-pulse">Loading...</span>}
        </h2>
        {tables.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-2">🃏</p>
            <p>No tables yet. Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map(({ address, account }) => {
              const phase = parseGamePhase(account.gamePhase);
              const isFull = account.players.length >= account.maxPlayers;

              return (
                <div
                  key={address}
                  className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-poker-gold/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-sm text-gray-400">Table #{account.tableId.toString()}</div>
                      <div className="text-lg font-bold text-white">
                        {lamportsToSol(account.buyIn.toNumber())} SOL buy-in
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        phase === "Waiting"
                          ? "bg-green-900/50 text-green-400"
                          : "bg-yellow-900/50 text-yellow-400"
                      }`}
                    >
                      {phase}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-400 mb-3">
                    <span>
                      {account.players.length}/{account.maxPlayers} players
                    </span>
                    <span>
                      {account.isPrivate ? "🔒 Private" : "🌐 Public"}
                    </span>
                  </div>

                  {account.pot.toNumber() > 0 && (
                    <div className="text-sm text-poker-gold mb-3">
                      Pot: {lamportsToSol(account.pot.toNumber())} SOL
                    </div>
                  )}

                  <button
                    onClick={() => onJoinTable(address)}
                    disabled={isFull && phase !== "Waiting"}
                    className={`w-full py-2 rounded-lg font-bold transition-colors ${
                      isFull
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-poker-gold/20 hover:bg-poker-gold/30 text-poker-gold"
                    }`}
                  >
                    {isFull ? "Table Full" : phase === "Waiting" ? "Join Table" : "Spectate"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
