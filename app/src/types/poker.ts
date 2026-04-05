import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export type GamePhase = "Waiting" | "PreFlop" | "Flop" | "Turn" | "River" | "Showdown";

export interface PlayerState {
  pubkey: PublicKey;
  seat: number;
  chips: BN;
  holeCards: number[];
  currentBet: BN;
  isFolded: boolean;
  isAllIn: boolean;
  isActive: boolean;
}

export interface GameTableAccount {
  tableId: BN;
  creator: PublicKey;
  maxPlayers: number;
  buyIn: BN;
  isPrivate: boolean;
  inviteCode: number[];
  players: PlayerState[];
  communityCards: number[];
  deck: number[];
  deckIndex: number;
  pot: BN;
  currentBet: BN;
  dealerPos: number;
  currentPlayer: number;
  gamePhase: Record<string, object>;
  roundNumber: BN;
  rakeBps: number;
  houseWallet: PublicKey;
  lastActionTs: BN;
  bump: number;
}

export type BetAction =
  | { fold: {} }
  | { check: {} }
  | { call: {} }
  | { raise: { amount: BN } }
  | { allIn: {} };

export function parseGamePhase(phase: Record<string, object>): GamePhase {
  if ("waiting" in phase) return "Waiting";
  if ("preFlop" in phase) return "PreFlop";
  if ("flop" in phase) return "Flop";
  if ("turn" in phase) return "Turn";
  if ("river" in phase) return "River";
  if ("showdown" in phase) return "Showdown";
  return "Waiting";
}
