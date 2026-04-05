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
        embeds: [new EmbedBuilder().setColor(colors.primary).setTitle('◉ LEADERBOARD').setDescription('```ansi\n\x1b[32m> leaderboard --top 10\n> No data found.\x1b[0m\n```').setFooter({ text: brand.footer }).setTimestamp()],
        ephemeral: true,
      });
    }

    const medals = ['🥇', '🥈', '🥉'];
    const lines = lb.map((entry, i) => {
      const prefix = medals[i] || `\`${(i + 1).toString().padStart(2)}.\``;
      return `${prefix} <@${entry.user_id}> — Level **${entry.level}** · ${entry.xp} XP`;
    });

    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle('◉ LEADERBOARD')
      .setDescription([
        '```ansi',
        '\x1b[32m> leaderboard --top 10\x1b[0m',
        '```',
        '',
        ...lines,
      ].join('\n'))
      .setFooter({ text: brand.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
