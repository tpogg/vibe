const { getGuildSettings } = require('../utils/database');
const { welcomeEmbed } = require('../utils/embeds');

module.exports = {
  name: 'guildMemberAdd',
  once: false,

  async execute(member) {
    const settings = getGuildSettings(member.guild.id);

    // Auto-role
    if (settings?.autorole_id) {
      try {
        const role = member.guild.roles.cache.get(settings.autorole_id);
        if (role) await member.roles.add(role);
      } catch (err) {
        console.error('[AUTOROLE]', err.message);
      }
    }

    // Welcome message
    if (settings?.welcome_channel_id) {
      try {
        const channel = member.guild.channels.cache.get(settings.welcome_channel_id);
        if (!channel) return;

        const embed = welcomeEmbed(member);

        await channel.send({ embeds: [embed] });
      } catch (err) {
        console.error('[WELCOME]', err.message);
      }
    }
  },
};
