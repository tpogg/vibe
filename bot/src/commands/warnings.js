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
        embeds: [new EmbedBuilder().setColor(colors.primary).setDescription(`**${target.username}** has no warnings.`)],
        ephemeral: true,
      });
    }

    const list = warns.slice(0, 10).map((w, i) => {
      const date = new Date(w.created_at * 1000).toLocaleDateString();
      return `\`${i + 1}.\` ${w.reason} — <@${w.moderator_id}> (${date})`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setColor(colors.warning)
      .setTitle(`Warnings — ${target.username}`)
      .setDescription(list)
      .setFooter({ text: `${warns.length} total warning(s) · ${brand.footer}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
