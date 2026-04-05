const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors, brand } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vibecheck')
    .setDescription('Check your current vibe level'),
  cooldown: 10,

  async execute(interaction) {
    const vibes = [
      { level: 'TRANSCENDENT', pct: 100, color: colors.accent, bar: '██████████████████████████████' },
      { level: 'IMMACULATE', pct: 95, color: colors.primary, bar: '████████████████████████████░░' },
      { level: 'LEGENDARY', pct: 85, color: colors.secondary, bar: '█████████████████████████░░░░░' },
      { level: 'EXCELLENT', pct: 75, color: colors.primary, bar: '██████████████████████░░░░░░░░' },
      { level: 'SOLID', pct: 60, color: colors.warning, bar: '██████████████████░░░░░░░░░░░░' },
      { level: 'MID', pct: 40, color: colors.warning, bar: '████████████░░░░░░░░░░░░░░░░░░' },
      { level: 'QUESTIONABLE', pct: 25, color: colors.danger, bar: '████████░░░░░░░░░░░░░░░░░░░░░░' },
      { level: 'NEGATIVE', pct: 10, color: colors.danger, bar: '███░░░░░░░░░░░░░░░░░░░░░░░░░░░' },
    ];

    const idx = Math.floor(Math.random() * vibes.length);
    const vibe = vibes[idx];

    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle('◉ VIBE CHECK')
      .setDescription([
        '```ansi',
        `\x1b[32m> vibecheck --scan ${interaction.user.username}\x1b[0m`,
        `\x1b[32m> Analysis complete.\x1b[0m`,
        '```',
        '',
        `**Status:** ${vibe.level}`,
        `**Level:** ${vibe.pct}%`,
        `\`[${vibe.bar}]\``,
      ].join('\n'))
      .setFooter({ text: brand.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
