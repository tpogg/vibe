"use client";

interface LeaderboardEntry {
  rank: number;
  address: string;
  winnings: number;
  gamesPlayed: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

export default function Leaderboard({ entries }: LeaderboardProps) {
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        🏆 Leaderboard
      </h2>
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-gray-900/50 text-sm text-gray-400 font-medium">
          <div>Rank</div>
          <div>Player</div>
          <div className="text-right">Winnings</div>
          <div className="text-right">Games</div>
        </div>
        {entries.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No games played yet. Be the first!
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.address}
              className="grid grid-cols-4 gap-4 px-6 py-3 border-t border-gray-700/50 hover:bg-gray-800/50 transition-colors"
            >
              <div className="text-white font-bold">
                {entry.rank <= 3 ? medals[entry.rank - 1] : `#${entry.rank}`}
              </div>
              <div className="text-gray-300 font-mono text-sm">
                {entry.address.slice(0, 4)}...{entry.address.slice(-4)}
              </div>
              <div className="text-right text-poker-gold font-bold">
                {(entry.winnings / 1e9).toFixed(2)} SOL
              </div>
              <div className="text-right text-gray-400">{entry.gamesPlayed}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
