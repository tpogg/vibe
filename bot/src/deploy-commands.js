const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const token = process.env.DISCORD_TOKEN || process.env.BOT_TOKEN || process.env.TOKEN;
const clientId = process.env.CLIENT_ID || process.env.DISCORD_CLIENT_ID;

if (!token || !clientId) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID environment variables.');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  if (command.data) commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`[VIBE] Registering ${commands.length} slash commands...`);
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log('[VIBE] Commands registered globally. May take up to 1 hour to propagate.');
  } catch (err) {
    console.error('[VIBE] Failed to register commands:', err);
  }
})();
