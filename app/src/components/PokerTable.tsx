"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { GameTableAccount, parseGamePhase } from "@/types/poker";
import Card from "./Card";
import PlayerSeat from "./PlayerSeat";
import PotDisplay from "./PotDisplay";
import ActionBar from "./ActionBar";
import ChatSidebar from "./ChatSidebar";

interface PokerTableProps {
  table: GameTableAccount;
  onFold: () => void;
  onCheck: () => void;
  onCall: () => void;
  onRaise: (amount: number) => void;
  onAllIn: () => void;
}

export default function PokerTable({
  table,
  onFold,
  onCheck,
  onCall,
  onRaise,
  onAllIn,
}: PokerTableProps) {
  const { publicKey } = useWallet();
  const phase = parseGamePhase(table.gamePhase);
  const myPlayerIndex = table.players.findIndex(
    (p) => publicKey && p.pubkey.equals(publicKey)
  );
  const isMyTurn = myPlayerIndex === table.currentPlayer && phase !== "Waiting" && phase !== "Showdown";

  // Determine which community cards to show based on phase
  const visibleCommunityCards = (() => {
    switch (phase) {
      case "Flop":
        return table.communityCards.slice(0, 3);
      case "Turn":
        return table.communityCards.slice(0, 4);
      case "River":
      case "Showdown":
        return table.communityCards.slice(0, 5);
      default:
        return [];
    }
  })();

  return (
    <div className="flex gap-4 h-full">
      {/* Main table area */}
      <div className="flex-1 flex flex-col gap-4">
        {/* The table */}
        <div className="relative flex-1 min-h-[500px]">
          {/* Green felt oval */}
          <div className="absolute inset-8 rounded-[50%] bg-gradient-to-br from-poker-felt to-poker-green border-8 border-amber-900 shadow-2xl" />

          {/* Community cards */}
          <div className="absolute top-[35%] left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {visibleCommunityCards.map((card, i) => (
              <Card key={i} cardIndex={card} size="md" />
            ))}
            {/* Placeholder slots */}
            {Array.from({ length: 5 - visibleCommunityCards.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-14 h-20 rounded-lg border-2 border-dashed border-green-700/30"
              />
            ))}
          </div>

          {/* Pot display */}
          <PotDisplay
            pot={table.pot.toNumber()}
            phase={phase}
            roundNumber={table.roundNumber.toNumber()}
          />

          {/* Player seats */}
          {table.players.map((player, i) => (
            <PlayerSeat
              key={player.pubkey.toString()}
              player={player}
              isCurrentTurn={table.currentPlayer === i && phase !== "Waiting"}
              isHero={myPlayerIndex === i}
              position={i}
              totalSeats={table.players.length}
            />
          ))}
        </div>

        {/* Action bar */}
        {myPlayerIndex >= 0 && phase !== "Waiting" && phase !== "Showdown" && (
          <ActionBar
            isMyTurn={isMyTurn}
            currentBet={table.currentBet.toNumber()}
            myCurrentBet={table.players[myPlayerIndex].currentBet.toNumber()}
            myChips={table.players[myPlayerIndex].chips.toNumber()}
            onFold={onFold}
            onCheck={onCheck}
            onCall={onCall}
            onRaise={onRaise}
            onAllIn={onAllIn}
          />
        )}

        {/* Showdown result */}
        {phase === "Showdown" && (
          <div className="bg-poker-gold/20 border border-poker-gold rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-poker-gold">Showdown! 🎉</p>
            <p className="text-gray-300">Settle the round to reveal the winner</p>
          </div>
        )}
      </div>

      {/* Chat sidebar */}
      <ChatSidebar tableId={table.tableId.toString()} />
    </div>
  );
}
