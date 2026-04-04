const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Get someone\'s avatar')
    .addUserOption(o => o.setName('user').setDescription('User')),
  cooldown: 3,

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const url = user.displayAvatarURL({ size: 1024, dynamic: true });

    const embed = new EmbedBuilder()
      .setColor(colors.secondary)
      .setTitle(`${user.username}'s Avatar`)
      .setImage(url)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
