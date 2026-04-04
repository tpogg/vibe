const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { modEmbed, successEmbed, errorEmbed } = require('../utils/embeds');
const { addWarning, getWarnings } = require('../utils/database');
const { getGuildSettings } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption(o => o.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for kick'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  cooldown: 5,

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.reply({ embeds: [errorEmbed('User not found in this server.')], ephemeral: true });
    if (!target.kickable) return interaction.reply({ embeds: [errorEmbed('I cannot kick this user.')], ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ embeds: [errorEmbed('You cannot kick yourself.')], ephemeral: true });

    await target.kick(reason);

    const embed = modEmbed('kick', interaction.user, target.user, reason);
    await interaction.reply({ embeds: [embed] });

    // Log
    const settings = getGuildSettings(interaction.guild.id);
    if (settings?.log_channel_id) {
      const logCh = interaction.guild.channels.cache.get(settings.log_channel_id);
      if (logCh) logCh.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
