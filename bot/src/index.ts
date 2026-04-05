// DiscordPoker Bot - Placeholder
// Full implementation requires DISCORD_BOT_TOKEN in .env
//
// Features (TODO):
// - /poker join <table_id> — Join a poker table
// - /deal — Start dealing (admin only)
// - /balance — Check SOL balance
// - /invite — Generate private table invite
// - Real-time turn notifications
// - Chat sync between Discord and frontend

import { Client, GatewayIntentBits, Events } from "discord.js";

const TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!TOKEN) {
  console.log("DiscordPoker Bot");
  console.log("================");
  console.log("No DISCORD_BOT_TOKEN found in environment.");
  console.log("Set it in .env to run the bot.");
  console.log("");
  console.log("Available commands (once configured):");
  console.log("  /poker join <table_id>  - Join a poker table");
  console.log("  /deal                   - Start dealing (admin)");
  console.log("  /balance [wallet]       - Check SOL balance");
  console.log("  /invite                 - Generate table invite");
  process.exit(0);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`DiscordPoker Bot ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // TODO: Implement command handlers
  switch (commandName) {
    case "poker":
      await interaction.reply({
        content: "Poker command received! Implementation coming soon.",
        ephemeral: true,
      });
      break;
    case "deal":
      await interaction.reply({
        content: "Deal command received! Implementation coming soon.",
        ephemeral: true,
      });
      break;
    case "balance":
      await interaction.reply({
        content: "Balance command received! Implementation coming soon.",
        ephemeral: true,
      });
      break;
    case "invite":
      await interaction.reply({
        content: "Invite command received! Implementation coming soon.",
        ephemeral: true,
      });
      break;
  }
});

client.login(TOKEN);
