const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { modEmbed, errorEmbed } = require('../utils/embeds');
const { getGuildSettings } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for ban'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  cooldown: 5,

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.reply({ embeds: [errorEmbed('User not found.')], ephemeral: true });
    if (!target.bannable) return interaction.reply({ embeds: [errorEmbed('I cannot ban this user.')], ephemeral: true });

    await target.ban({ reason });

    const embed = modEmbed('ban', interaction.user, target.user, reason);
    await interaction.reply({ embeds: [embed] });

    const settings = getGuildSettings(interaction.guild.id);
    if (settings?.log_channel_id) {
      const logCh = interaction.guild.channels.cache.get(settings.log_channel_id);
      if (logCh) logCh.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
