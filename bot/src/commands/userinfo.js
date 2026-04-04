const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors, brand } = require('../config');
const { getXp } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Display user details')
    .addUserOption(o => o.setName('user').setDescription('User to inspect')),
  cooldown: 5,

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);

    const joined = member ? Math.floor(member.joinedTimestamp / 1000) : null;
    const created = Math.floor(user.createdTimestamp / 1000);
    const roles = member ? member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => r.toString()).join(' ') || 'None' : 'N/A';

    const xpData = getXp(user.id, interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor(member?.displayHexColor || colors.primary)
      .setTitle(`${user.username}`)
      .setThumbnail(user.displayAvatarURL({ size: 256, dynamic: true }))
      .addFields(
        { name: 'Account Created', value: `<t:${created}:R>`, inline: true },
        { name: 'Joined Server', value: joined ? `<t:${joined}:R>` : 'N/A', inline: true },
        { name: 'Level', value: xpData ? `${xpData.level} (${xpData.xp} XP)` : '0', inline: true },
        { name: 'Roles', value: roles, inline: false },
      )
      .setFooter({ text: `ID: ${user.id} · ${brand.footer}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
