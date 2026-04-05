const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getWarnings } = require('../utils/database');
const { colors, brand } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View warnings for a user')
    .addUserOption(o => o.setName('user').setDescription('User to check').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  cooldown: 5,

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const warns = getWarnings(interaction.guild.id, target.id);

    if (warns.length === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(colors.primary).setTitle('◉ WARNINGS').setDescription('```ansi\n\x1b[32m> warnings --user ' + target.username + '\n> No records found.\x1b[0m\n```').setFooter({ text: brand.footer }).setTimestamp()],
        ephemeral: true,
      });
    }

    const list = warns.slice(0, 10).map((w, i) => {
      const date = new Date(w.created_at * 1000).toLocaleDateString();
      return `\`${i + 1}.\` ${w.reason} — <@${w.moderator_id}> (${date})`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle(`◉ WARNINGS — ${target.username.toUpperCase()}`)
      .setDescription([
        '```ansi',
        `\x1b[32m> warnings --user ${target.username}\x1b[0m`,
        '```',
        '',
        list,
      ].join('\n'))
      .setFooter({ text: `${warns.length} total warning(s) · ${brand.footer}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
