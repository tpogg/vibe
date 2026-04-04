const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { colors, brand } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Open a support ticket'),
  cooldown: 30,

  async execute(interaction) {
    // Defer to the ticket system handler
    const ticketSystem = require('../systems/ticket');
    await ticketSystem.createTicket(interaction, interaction.client);
  },
};
