const { EmbedBuilder } = require('discord.js');
const { starboard: sbConfig, colors } = require('../config');
const { getGuildSettings, getStarboardEntry, upsertStarboardEntry } = require('../utils/database');
const { starboardEmbed } = require('../utils/embeds');

module.exports = {
  name: 'messageReactionAdd',
  once: false,

  async execute(reaction) {
    if (reaction.partial) {
      try { await reaction.fetch(); } catch { return; }
    }
    if (reaction.message.partial) {
      try { await reaction.message.fetch(); } catch { return; }
    }

    const message = reaction.message;
    if (!message.guild || message.author.bot) return;
    if (reaction.emoji.name !== sbConfig.emoji) return;

    const settings = getGuildSettings(message.guild.id);
    if (!settings?.starboard_channel_id) return;

    const starChannel = message.guild.channels.cache.get(settings.starboard_channel_id);
    if (!starChannel) return;

    // Don't starboard messages from the starboard channel
    if (message.channel.id === starChannel.id) return;

    const stars = reaction.count;
    if (stars < sbConfig.threshold) return;

    const existing = getStarboardEntry(message.id);

    if (existing?.starboard_message_id) {
      // Update existing starboard post
      try {
        const sbMsg = await starChannel.messages.fetch(existing.starboard_message_id);
        await sbMsg.edit({ embeds: [starboardEmbed(message, stars)] });
      } catch {}
      upsertStarboardEntry(message.id, {
        starboardMessageId: existing.starboard_message_id,
        guildId: message.guild.id,
        channelId: message.channel.id,
        authorId: message.author.id,
        stars,
      });
    } else {
      // New starboard post
      try {
        const sbMsg = await starChannel.send({ embeds: [starboardEmbed(message, stars)] });
        upsertStarboardEntry(message.id, {
          starboardMessageId: sbMsg.id,
          guildId: message.guild.id,
          channelId: message.channel.id,
          authorId: message.author.id,
          stars,
        });
      } catch (err) {
        console.error('[STARBOARD]', err.message);
      }
    }
  },
};
