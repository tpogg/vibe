const { EmbedBuilder, MessageFlags } = require('discord.js');
const { colors, brand } = require('../config');

module.exports = {
  name: 'messageDelete',
  once: false,

  async execute(message) {
    // Skip bots, partials with no content, DMs
    if (!message.guild || message.author?.bot) return;
    if (!message.content && !message.attachments?.size) return;

    // Don't repost in staff channels
    const channelName = message.channel.name || '';
    if (channelName.includes('mod-log') || channelName.includes('admin')) return;

    try {
      const embed = new EmbedBuilder()
        .setColor(colors.dim)
        .setTitle('◉ DELETED MESSAGE')
        .setDescription([
          '```ansi',
          `\x1b[32m> msg --restore\x1b[0m`,
          '```',
          '',
          message.content || '*[no text content]*',
        ].join('\n'))
        .addFields(
          { name: 'Author', value: `${message.author}`, inline: true },
          { name: 'Channel', value: `${message.channel}`, inline: true },
        )
        .setFooter({ text: brand.footer })
        .setTimestamp();

      // If there was an image attachment, show it
      if (message.attachments?.size > 0) {
        const img = message.attachments.find(a => a.contentType?.startsWith('image/'));
        if (img) embed.setImage(img.proxyURL);
      }

      await message.channel.send({
        embeds: [embed],
        flags: [MessageFlags.SuppressNotifications],
      });
    } catch (err) {
      console.error('[MSG-DELETE]', err.message);
    }
  },
};
