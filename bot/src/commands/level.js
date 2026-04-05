const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors, brand } = require('../config');
const { getXp, getLeaderboard } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Check your level and XP')
    .addUserOption(o => o.setName('user').setDescription('User to check')),
  cooldown: 5,

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const data = getXp(user.id, interaction.guild.id);

    if (!data || data.xp === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(colors.primary).setTitle('◉ LEVEL').setDescription('```ansi\n\x1b[32m> level --user ' + user.username + '\n> No data found.\x1b[0m\n```').setFooter({ text: brand.footer }).setTimestamp()],
        ephemeral: true,
      });
    }

    const xpForNext = xpForLevel(data.level + 1);
    const progress = Math.min(data.xp / xpForNext, 1);
    const barLen = 20;
    const filled = Math.round(progress * barLen);
    const bar = brand.emoji.bar.repeat(filled) + brand.emoji.barEmpty.repeat(barLen - filled);

    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle(`◉ LEVEL — ${user.username.toUpperCase()}`)
      .setThumbnail(user.displayAvatarURL({ size: 128 }))
      .setDescription([
        '```ansi',
        `\x1b[32m> level --user ${user.username}\x1b[0m`,
        `\x1b[32m> XP: ${data.xp} / ${xpForNext}\x1b[0m`,
        `\x1b[32m> [${bar}] ${Math.round(progress * 100)}%\x1b[0m`,
        '```',
        '',
        `**Messages:** ${data.messages}`,
        `**Level:** ${data.level}`,
      ].join('\n'))
      .setFooter({ text: brand.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

function xpForLevel(level) {
  return 100 * level * level;
}

module.exports.xpForLevel = xpForLevel;
