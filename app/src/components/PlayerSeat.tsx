"use client";

import { PlayerState } from "@/types/poker";
import { lamportsToSol } from "@/lib/constants";
import Card from "./Card";

interface PlayerSeatProps {
  player: PlayerState;
  isCurrentTurn: boolean;
  isHero: boolean; // true if this is the connected wallet's player
  position: number;
  totalSeats: number;
}

// Position seats around an oval table
function getSeatPosition(position: number, totalSeats: number) {
  const angle = (position / totalSeats) * 2 * Math.PI - Math.PI / 2;
  const rx = 42; // % horizontal radius
  const ry = 38; // % vertical radius
  return {
    left: `${50 + rx * Math.cos(angle)}%`,
    top: `${50 + ry * Math.sin(angle)}%`,
  };
}

export default function PlayerSeat({
  player,
  isCurrentTurn,
  isHero,
  position,
  totalSeats,
}: PlayerSeatProps) {
  const pos = getSeatPosition(position, totalSeats);
  const shortAddr = `${player.pubkey.toString().slice(0, 4)}...${player.pubkey.toString().slice(-4)}`;

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
      style={{ left: pos.left, top: pos.top }}
    >
      {/* Hole cards */}
      <div className="flex gap-0.5">
        <Card
          cardIndex={player.holeCards[0]}
          faceDown={!isHero || player.isFolded}
          size="sm"
        />
        <Card
          cardIndex={player.holeCards[1]}
          faceDown={!isHero || player.isFolded}
          size="sm"
        />
      </div>

      {/* Player info */}
      <div
        className={`px-3 py-1.5 rounded-xl text-center min-w-[100px] transition-all ${
          player.isFolded
            ? "bg-gray-700/80 opacity-50"
            : isCurrentTurn
            ? "bg-poker-gold/20 border-2 border-poker-gold animate-pulse-glow"
            : isHero
            ? "bg-blue-900/80 border border-blue-400"
            : "bg-gray-800/80 border border-gray-600"
        }`}
      >
        <div className="text-xs text-gray-300 truncate">{shortAddr}</div>
        <div className="text-sm font-bold text-white">
          {lamportsToSol(player.chips.toNumber())} SOL
        </div>
        {player.currentBet.toNumber() > 0 && (
          <div className="text-xs text-poker-gold">
            Bet: {lamportsToSol(player.currentBet.toNumber())} SOL
          </div>
        )}
        {player.isFolded && <div className="text-xs text-red-400">FOLDED</div>}
        {player.isAllIn && <div className="text-xs text-yellow-400 font-bold">ALL IN!</div>}
      </div>
    </div>
  );
}
