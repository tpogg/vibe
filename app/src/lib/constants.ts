import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || "D8Wy2hh16z76BDxu8jEyZQTcVYSeAWTgS4xyqZQzp9vT"
);

export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

export const HOUSE_WALLET = new PublicKey(
  process.env.NEXT_PUBLIC_HOUSE_WALLET || "11111111111111111111111111111111"
);

export const LAMPORTS_PER_SOL = 1_000_000_000;

export const CARD_RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
export const CARD_SUITS = ["♥", "♦", "♣", "♠"];
export const SUIT_COLORS: Record<string, string> = {
  "♥": "text-red-500",
  "♦": "text-red-500",
  "♣": "text-white",
  "♠": "text-white",
};

export function cardToString(cardIndex: number): { rank: string; suit: string } {
  if (cardIndex === 255 || cardIndex >= 52) return { rank: "?", suit: "" };
  return {
    rank: CARD_RANKS[cardIndex % 13],
    suit: CARD_SUITS[Math.floor(cardIndex / 13)],
  };
}

export function lamportsToSol(lamports: number): string {
  return (lamports / LAMPORTS_PER_SOL).toFixed(4);
}

export const WIN_EMOJIS = ["🎉", "🏆", "💰", "🔥", "⭐", "🎊", "💎", "🚀"];
export function randomWinEmoji(): string {
  return WIN_EMOJIS[Math.floor(Math.random() * WIN_EMOJIS.length)];
}
