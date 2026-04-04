const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors, brand } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Display server statistics'),
  cooldown: 10,

  async execute(interaction) {
    const guild = interaction.guild;
    await guild.members.fetch().catch(() => {});

    const online = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
    const channels = guild.channels.cache;
    const textCh = channels.filter(c => c.type === 0).size;
    const voiceCh = channels.filter(c => c.type === 2).size;
    const categories = channels.filter(c => c.type === 4).size;
    const roles = guild.roles.cache.size - 1; // exclude @everyone
    const created = Math.floor(guild.createdTimestamp / 1000);
    const boostLevel = guild.premiumTier;
    const boostCount = guild.premiumSubscriptionCount || 0;

    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle(`${guild.name} — Server Info`)
      .setThumbnail(guild.iconURL({ size: 256, dynamic: true }))
      .setDescription([
        '```ansi',
        '\x1b[32m> SERVER_INFO.exe\x1b[0m',
        '\x1b[32m> Scanning server metrics...\x1b[0m',
        '```',
      ].join('\n'))
      .addFields(
        { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: 'Created', value: `<t:${created}:R>`, inline: true },
        { name: 'Members', value: `**${guild.memberCount}** total`, inline: true },
        { name: 'Channels', value: `${textCh} text · ${voiceCh} voice · ${categories} categories`, inline: false },
        { name: 'Roles', value: `${roles}`, inline: true },
        { name: 'Boost', value: `Level ${boostLevel} (${boostCount} boosts)`, inline: true },
        { name: 'Server ID', value: `\`${guild.id}\``, inline: true },
      )
      .setFooter({ text: brand.footer })
      .setTimestamp();

    if (guild.bannerURL()) embed.setImage(guild.bannerURL({ size: 512 }));

    await interaction.reply({ embeds: [embed] });
  },
};
