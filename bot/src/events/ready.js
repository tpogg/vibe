module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`[VIBE] Online as ${client.user.tag}`);
    console.log(`[VIBE] Serving ${client.guilds.cache.size} guild(s)`);
    console.log(`[VIBE] ${client.commands.size} commands loaded`);
  },
};
