const { getGuildSettings } = require('../utils/database');
const { goodbyeEmbed } = require('../utils/embeds');

module.exports = {
  name: 'guildMemberRemove',
  once: false,

  async execute(member) {
    const settings = getGuildSettings(member.guild.id);

    if (settings?.welcome_channel_id) {
      try {
        const channel = member.guild.channels.cache.get(settings.welcome_channel_id);
        if (channel) await channel.send({ embeds: [goodbyeEmbed(member)] });
      } catch (err) {
        console.error('[GOODBYE]', err.message);
      }
    }
  },
};
