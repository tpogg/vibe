"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import LeaderboardComponent from "@/components/Leaderboard";

// In production, this would fetch from an indexer or on-chain data
const MOCK_LEADERBOARD = [
  { rank: 1, address: "7xKX...4m2p", winnings: 12.5e9, gamesPlayed: 42 },
  { rank: 2, address: "3nBq...8kLz", winnings: 8.3e9, gamesPlayed: 35 },
  { rank: 3, address: "9pRm...2wYx", winnings: 5.1e9, gamesPlayed: 28 },
  { rank: 4, address: "4tFh...6jNc", winnings: 3.7e9, gamesPlayed: 19 },
  { rank: 5, address: "8vDz...1sQr", winnings: 2.2e9, gamesPlayed: 15 },
];

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <a href="/" className="text-gray-400 hover:text-white">
            &larr; Back to Lobby
          </a>
          <WalletMultiButton />
        </div>
        <LeaderboardComponent entries={MOCK_LEADERBOARD} />
      </div>
    </div>
  );
}
