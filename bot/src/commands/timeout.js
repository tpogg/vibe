const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { modEmbed, errorEmbed } = require('../utils/embeds');
const { getGuildSettings } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member')
    .addUserOption(o => o.setName('user').setDescription('User to timeout').setRequired(true))
    .addIntegerOption(o => o.setName('minutes').setDescription('Duration in minutes').setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption(o => o.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  cooldown: 5,

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const minutes = interaction.options.getInteger('minutes');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.reply({ embeds: [errorEmbed('User not found.')], ephemeral: true });
    if (!target.moderatable) return interaction.reply({ embeds: [errorEmbed('I cannot timeout this user.')], ephemeral: true });

    await target.timeout(minutes * 60_000, reason);

    const embed = modEmbed('timeout', interaction.user, target.user, `${reason} (${minutes}m)`);
    await interaction.reply({ embeds: [embed] });

    const settings = getGuildSettings(interaction.guild.id);
    if (settings?.log_channel_id) {
      const logCh = interaction.guild.channels.cache.get(settings.log_channel_id);
      if (logCh) logCh.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
