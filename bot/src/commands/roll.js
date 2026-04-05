const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors, brand } = require('../config');

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
      .setColor(colors.primary)
      .setTitle('◉ ROLL')
      .setDescription([
        '```ansi',
        `\x1b[32m> roll --dice ${count}d${sides}\x1b[0m`,
        `\x1b[32m> Results: [${rolls.join(', ')}]\x1b[0m`,
        count > 1 ? `\x1b[32m> Total: ${total}\x1b[0m` : '',
        '```',
      ].filter(Boolean).join('\n'))
      .setFooter({ text: brand.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
