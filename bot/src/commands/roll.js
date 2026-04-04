const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll dice')
    .addStringOption(o => o.setName('dice').setDescription('e.g. 2d6, d20 (default: d6)')),
  cooldown: 3,

  async execute(interaction) {
    const input = interaction.options.getString('dice') || 'd6';
    const match = input.match(/^(\d*)d(\d+)$/i);

    if (!match) {
      return interaction.reply({ content: '`Invalid format. Use NdN (e.g. 2d6, d20)`', ephemeral: true });
    }

    const count = Math.min(parseInt(match[1] || '1'), 20);
    const sides = Math.min(parseInt(match[2]), 1000);
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    const total = rolls.reduce((a, b) => a + b, 0);

    const embed = new EmbedBuilder()
      .setColor(colors.secondary)
      .setDescription([
        '```ansi',
        `\x1b[36m> Rolling ${count}d${sides}...\x1b[0m`,
        `\x1b[1;33m> Results: [${rolls.join(', ')}]\x1b[0m`,
        count > 1 ? `\x1b[1;32m> Total: ${total}\x1b[0m` : '',
        '```',
      ].filter(Boolean).join('\n'));

    await interaction.reply({ embeds: [embed] });
  },
};
