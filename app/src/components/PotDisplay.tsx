"use client";

import { lamportsToSol } from "@/lib/constants";

interface PotDisplayProps {
  pot: number;
  phase: string;
  roundNumber: number;
}

export default function PotDisplay({ pot, phase, roundNumber }: PotDisplayProps) {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
      <div className="bg-black/60 rounded-xl px-6 py-3 backdrop-blur-sm">
        <div className="text-xs text-gray-400 uppercase tracking-wider">
          Round #{roundNumber} &middot; {phase}
        </div>
        <div className="text-2xl font-bold text-poker-gold">
          {lamportsToSol(pot)} SOL
        </div>
        <div className="text-xs text-gray-500">POT</div>
      </div>
    </div>
  );
}
