const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors, brand } = require('../config');
const { getLeaderboard } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the server XP leaderboard'),
  cooldown: 15,

  async execute(interaction) {
    const lb = getLeaderboard(interaction.guild.id, 10);

    if (lb.length === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(colors.dim).setDescription('No XP data yet. Start chatting!')],
        ephemeral: true,
      });
    }

    const medals = ['🥇', '🥈', '🥉'];
    const lines = lb.map((entry, i) => {
      const prefix = medals[i] || `\`${(i + 1).toString().padStart(2)}.\``;
      return `${prefix} <@${entry.user_id}> — Level **${entry.level}** · ${entry.xp} XP`;
    });

    const embed = new EmbedBuilder()
      .setColor(colors.warning)
      .setTitle(`${brand.emoji.crown} Leaderboard`)
      .setDescription([
        '```ansi',
        '\x1b[33m> LEADERBOARD.exe\x1b[0m',
        '```',
        '',
        ...lines,
      ].join('\n'))
      .setFooter({ text: brand.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
