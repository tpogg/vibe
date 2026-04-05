// Deploy slash commands to Discord
// Run: npx ts-node deploy-commands.ts
//
// Requires DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, and DISCORD_GUILD_ID in .env

import { REST, Routes } from "discord.js";

const TOKEN = process.env.DISCORD_BOT_TOKEN!;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const GUILD_ID = process.env.DISCORD_GUILD_ID!;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("Missing DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, or DISCORD_GUILD_ID");
  process.exit(1);
}

// Import command definitions
import { data as pokerData } from "./src/commands/poker";
import { data as dealData } from "./src/commands/deal";
import { data as balanceData } from "./src/commands/balance";
import { data as inviteData } from "./src/commands/invite";

const commands = [pokerData, dealData, balanceData, inviteData].map((cmd) => cmd.toJSON());

const rest = new REST().setToken(TOKEN);

(async () => {
  try {
    console.log(`Registering ${commands.length} slash commands...`);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log("Commands registered successfully!");
  } catch (error) {
    console.error("Failed to register commands:", error);
  }
})();
