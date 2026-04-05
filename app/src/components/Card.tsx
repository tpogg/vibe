"use client";

import { cardToString, SUIT_COLORS } from "@/lib/constants";

interface CardProps {
  cardIndex: number;
  faceDown?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-10 h-14 text-xs",
  md: "w-14 h-20 text-sm",
  lg: "w-20 h-28 text-lg",
};

export default function Card({ cardIndex, faceDown = false, size = "md" }: CardProps) {
  const { rank, suit } = cardToString(cardIndex);
  const isUnknown = cardIndex === 255 || cardIndex >= 52;

  if (faceDown || isUnknown) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-lg border-2 border-gray-600 bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center shadow-lg`}
      >
        <div className="text-2xl opacity-50">🂠</div>
      </div>
    );
  }

  const suitColor = SUIT_COLORS[suit] || "text-white";

  return (
    <div
      className={`${sizeClasses[size]} rounded-lg border-2 border-gray-300 bg-white flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105`}
    >
      <span className={`font-bold ${suitColor}`}>{rank}</span>
      <span className={`${suitColor} text-lg`}>{suit}</span>
    </div>
  );
}
