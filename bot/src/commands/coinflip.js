const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors, brand } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a quantum coin'),
  cooldown: 3,

  async execute(interaction) {
    const result = Math.random() < 0.5 ? 'HEADS' : 'TAILS';
    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle('◉ COINFLIP')
      .setDescription([
        '```ansi',
        `\x1b[32m> flip --quantum\x1b[0m`,
        `\x1b[32m> Result: ${result}\x1b[0m`,
        '```',
      ].join('\n'))
      .setFooter({ text: brand.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
