"use client";

import { useRouter } from "next/navigation";
import { usePokerGame } from "@/hooks/usePokerGame";
import { useGameActions } from "@/hooks/useGameActions";
import Lobby from "@/components/Lobby";

export default function Home() {
  const router = useRouter();
  const { tables, loading } = usePokerGame();
  const { createTable, joinTable } = useGameActions();

  const handleCreateTable = async (maxPlayers: number, buyIn: number, isPrivate: boolean) => {
    try {
      const tableAddress = await createTable(maxPlayers, buyIn, isPrivate);
      router.push(`/table/${tableAddress}`);
    } catch (err) {
      console.error("Failed to create table:", err);
      alert("Failed to create table. Check console for details.");
    }
  };

  const handleJoinTable = async (tableAddress: string) => {
    router.push(`/table/${tableAddress}`);
  };

  return (
    <main className="min-h-screen">
      <Lobby
        tables={tables}
        onCreateTable={handleCreateTable}
        onJoinTable={handleJoinTable}
        loading={loading}
      />
    </main>
  );
}
