const { MessageFlags } = require('discord.js');
const { getGuildSettings } = require('../utils/database');

module.exports = {
  name: 'guildMemberAdd',
  once: false,

  async execute(member) {
    const settings = getGuildSettings(member.guild.id);

    // Don't auto-role — user must verify first
    // The verification system grants the Viber role after passing

    // Silent log to welcome channel (no notification)
    if (settings?.welcome_channel_id) {
      try {
        const channel = member.guild.channels.cache.get(settings.welcome_channel_id);
        if (!channel) return;

        // Minimal, silent join log — no ping, no noise
        await channel.send({
          content: `\`>\` **${member.user.username}** connected to the grid. (\`#${member.guild.memberCount}\`)`,
          flags: [MessageFlags.SuppressNotifications],
        });
      } catch (err) {
        console.error('[WELCOME]', err.message);
      }
    }
  },
};
