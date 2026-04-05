const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency'),
  cooldown: 5,

  async execute(interaction, client) {
    const sent = await interaction.reply({ content: '`Pinging...`', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const api = Math.round(client.ws.ping);

    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setDescription([
        '```ansi',
        `\x1b[32m> PING: ${latency}ms\x1b[0m`,
        `\x1b[32m> API:  ${api}ms\x1b[0m`,
        '```',
      ].join('\n'));

    await interaction.editReply({ content: null, embeds: [embed] });
  },
};
