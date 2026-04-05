"use client";

import { useState } from "react";
import { lamportsToSol, LAMPORTS_PER_SOL } from "@/lib/constants";

interface ActionBarProps {
  isMyTurn: boolean;
  currentBet: number;
  myCurrentBet: number;
  myChips: number;
  onFold: () => void;
  onCheck: () => void;
  onCall: () => void;
  onRaise: (amount: number) => void;
  onAllIn: () => void;
}

export default function ActionBar({
  isMyTurn,
  currentBet,
  myCurrentBet,
  myChips,
  onFold,
  onCheck,
  onCall,
  onRaise,
  onAllIn,
}: ActionBarProps) {
  const [raiseAmount, setRaiseAmount] = useState(currentBet * 2);
  const callAmount = currentBet - myCurrentBet;
  const canCheck = myCurrentBet >= currentBet;
  const minRaise = currentBet * 2;

  if (!isMyTurn) {
    return (
      <div className="bg-gray-900/90 rounded-xl px-6 py-4 text-center">
        <p className="text-gray-400 animate-pulse">Waiting for other players...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/90 rounded-xl px-4 py-3 flex flex-wrap items-center gap-2 justify-center">
      <button
        onClick={onFold}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
      >
        Fold
      </button>

      {canCheck ? (
        <button
          onClick={onCheck}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold transition-colors"
        >
          Check
        </button>
      ) : (
        <button
          onClick={onCall}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors"
        >
          Call {lamportsToSol(callAmount)}
        </button>
      )}

      <div className="flex items-center gap-1">
        <input
          type="range"
          min={minRaise}
          max={myChips + myCurrentBet}
          step={LAMPORTS_PER_SOL / 100}
          value={raiseAmount}
          onChange={(e) => setRaiseAmount(Number(e.target.value))}
          className="w-24 accent-poker-gold"
        />
        <button
          onClick={() => onRaise(raiseAmount)}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold transition-colors"
        >
          Raise {lamportsToSol(raiseAmount)}
        </button>
      </div>

      <button
        onClick={onAllIn}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors animate-pulse"
      >
        All In!
      </button>
    </div>
  );
}
