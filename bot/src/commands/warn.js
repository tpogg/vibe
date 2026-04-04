const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addWarning, getWarnings, getGuildSettings } = require('../utils/database');
const { colors, brand } = require('../config');
const { errorEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .addUserOption(o => o.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  cooldown: 3,

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    if (target.bot) return interaction.reply({ embeds: [errorEmbed('Cannot warn bots.')], ephemeral: true });

    addWarning(interaction.guild.id, target.id, interaction.user.id, reason);
    const warnings = getWarnings(interaction.guild.id, target.id);

    const embed = new EmbedBuilder()
      .setColor(colors.warning)
      .setTitle(`${brand.emoji.shield} Warning Issued`)
      .addFields(
        { name: 'User', value: `${target}`, inline: true },
        { name: 'Moderator', value: `${interaction.user}`, inline: true },
        { name: 'Reason', value: reason, inline: false },
        { name: 'Total Warnings', value: `**${warnings.length}**`, inline: true },
      )
      .setFooter({ text: brand.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const settings = getGuildSettings(interaction.guild.id);
    if (settings?.log_channel_id) {
      const logCh = interaction.guild.channels.cache.get(settings.log_channel_id);
      if (logCh) logCh.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
