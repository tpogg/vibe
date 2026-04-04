const { Client, GatewayIntentBits, Partials, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { initDatabase } = require('./utils/database');

// ─── Client ──────────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Reaction, Partials.GuildMember],
});

client.commands = new Collection();
client.cooldowns = new Collection();

// ─── Load Commands ───────────────────────────────────────────────────────────
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const cmd = require(path.join(commandsPath, file));
  if (cmd.data && cmd.execute) client.commands.set(cmd.data.name, cmd);
}

// ─── Load Events ─────────────────────────────────────────────────────────────
const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// ─── Interaction Handler ─────────────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    // Cooldown
    if (!client.cooldowns.has(command.data.name)) {
      client.cooldowns.set(command.data.name, new Collection());
    }
    const now = Date.now();
    const timestamps = client.cooldowns.get(command.data.name);
    const cooldownMs = (command.cooldown ?? 3) * 1000;

    if (timestamps.has(interaction.user.id)) {
      const expiry = timestamps.get(interaction.user.id) + cooldownMs;
      if (now < expiry) {
        const left = ((expiry - now) / 1000).toFixed(1);
        return interaction.reply({ content: `\`⏳ Cooldown: ${left}s\``, ephemeral: true });
      }
    }
    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownMs);

    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(`[CMD] /${command.data.name}:`, err);
      const msg = { content: '```ansi\n\x1b[31m⚠ Command error.\x1b[0m\n```', ephemeral: true };
      interaction.replied || interaction.deferred
        ? await interaction.followUp(msg).catch(() => {})
        : await interaction.reply(msg).catch(() => {});
    }
  }

  // Buttons
  if (interaction.isButton()) {
    for (const sys of ['ticket', 'reactionroles']) {
      try {
        const handler = require(`./systems/${sys}`);
        if (handler.handleButton && await handler.handleButton(interaction, client)) return;
      } catch {}
    }
  }

  // Modals
  if (interaction.isModalSubmit()) {
    try {
      const t = require('./systems/ticket');
      if (t.handleModal) await t.handleModal(interaction, client);
    } catch {}
  }
});

// ─── Rotating Status ─────────────────────────────────────────────────────────
const STATUSES = [
  { type: ActivityType.Watching, name: 'the future unfold' },
  { type: ActivityType.Playing, name: 'VIBE TERMINAL v2.0' },
  { type: ActivityType.Listening, name: '/help for commands' },
  { type: ActivityType.Competing, name: 'the simulation' },
  { type: ActivityType.Playing, name: 'with quantum bits' },
  { type: ActivityType.Listening, name: 'lo-fi beats' },
];

let si = 0;
client.once('ready', () => {
  const rotate = () => {
    const s = STATUSES[si++ % STATUSES.length];
    client.user.setActivity(s.name, { type: s.type });
  };
  rotate();
  setInterval(rotate, 30_000);
});

// ─── Init ────────────────────────────────────────────────────────────────────
initDatabase();

const token = process.env.DISCORD_TOKEN || process.env.BOT_TOKEN || process.env.TOKEN;
if (!token) {
  console.error('[FATAL] No token. Set DISCORD_TOKEN env var.');
  process.exit(1);
}

client.login(token);

process.on('SIGINT', () => { client.destroy(); process.exit(0); });
process.on('SIGTERM', () => { client.destroy(); process.exit(0); });
