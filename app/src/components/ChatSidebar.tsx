"use client";

import { useState, useRef, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

interface Message {
  sender: string;
  text: string;
  timestamp: number;
}

interface ChatSidebarProps {
  tableId: string;
}

export default function ChatSidebar({ tableId }: ChatSidebarProps) {
  const { publicKey } = useWallet();
  const [messages, setMessages] = useState<Message[]>([
    { sender: "System", text: `Welcome to Table #${tableId}! Good luck! 🍀`, timestamp: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !publicKey) return;
    const addr = publicKey.toString();
    setMessages((prev) => [
      ...prev,
      {
        sender: `${addr.slice(0, 4)}...${addr.slice(-4)}`,
        text: input.trim(),
        timestamp: Date.now(),
      },
    ]);
    setInput("");
  };

  return (
    <div className="w-72 bg-gray-900/90 rounded-xl flex flex-col border border-gray-700 hidden lg:flex">
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="font-bold text-white text-sm">Chat</h3>
        <p className="text-xs text-gray-500">Synced with Discord</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[400px]">
        {messages.map((msg, i) => (
          <div key={i} className="text-sm">
            <span className="text-poker-gold font-medium">{msg.sender}: </span>
            <span className="text-gray-300">{msg.text}</span>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-poker-gold"
          />
          <button
            onClick={sendMessage}
            className="px-3 py-2 bg-poker-gold/20 text-poker-gold rounded-lg text-sm hover:bg-poker-gold/30 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
