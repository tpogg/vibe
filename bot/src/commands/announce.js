const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { colors, brand } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Post a styled announcement')
    .addStringOption(o => o.setName('title').setDescription('Announcement title').setRequired(true))
    .addStringOption(o => o.setName('message').setDescription('Announcement body').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Channel to post in'))
    .addStringOption(o => o.setName('color').setDescription('Color: green, cyan, magenta, amber, red').addChoices(
      { name: 'Green', value: 'green' },
      { name: 'Cyan', value: 'cyan' },
      { name: 'Magenta', value: 'magenta' },
      { name: 'Amber', value: 'amber' },
      { name: 'Red', value: 'red' },
    ))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  cooldown: 10,

  async execute(interaction) {
    const title = interaction.options.getString('title');
    const message = interaction.options.getString('message');
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const colorName = interaction.options.getString('color') || 'green';

    const colorMap = {
      green: colors.primary,
      cyan: colors.secondary,
      magenta: colors.accent,
      amber: colors.warning,
      red: colors.danger,
    };

    const embed = new EmbedBuilder()
      .setColor(colorMap[colorName])
      .setTitle(`📢  ${title}`)
      .setDescription(message)
      .setFooter({ text: `Announced by ${interaction.user.username} · ${brand.footer}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    await interaction.reply({ content: `\`✓ Announcement posted in #${channel.name}\``, ephemeral: true });
  },
};
