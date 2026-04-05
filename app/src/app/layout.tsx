import type { Metadata } from "next";
import WalletProvider from "@/components/WalletProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "DiscordPoker - Decentralized Texas Hold'em on Solana",
  description: "Play poker on-chain with provably fair card dealing, real-time multiplayer, and Discord integration.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-poker-dark">
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
