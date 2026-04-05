const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages')
    .addIntegerOption(o => o.setName('amount').setDescription('Number of messages (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  cooldown: 10,

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');

    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);
      await interaction.reply({
        embeds: [successEmbed(`Deleted ${deleted.size} messages.`)],
        ephemeral: true,
      });
    } catch (err) {
      await interaction.reply({ embeds: [errorEmbed('Could not delete messages. They may be older than 14 days.')], ephemeral: true });
    }
  },
};
