const { EmbedBuilder } = require('discord.js');
const { colors, brand } = require('../config');

// Standard VIBE-branded embed
function vibeEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(colors.primary)
    .setTitle(title ? `◉ ${title}` : null)
    .setDescription(description || null)
    .setFooter({ text: brand.footer })
    .setTimestamp();
}

// Success embed
function successEmbed(description) {
  return new EmbedBuilder()
    .setColor(colors.primary)
    .setDescription(`\`\`\`ansi\n\x1b[32m> ${description}\x1b[0m\n\`\`\``)
    .setFooter({ text: brand.footer })
    .setTimestamp();
}

// Error embed
function errorEmbed(description) {
  return new EmbedBuilder()
    .setColor(colors.danger)
    .setDescription(`\`\`\`ansi\n\x1b[31m> ${description}\x1b[0m\n\`\`\``)
    .setFooter({ text: brand.footer })
    .setTimestamp();
}

// Mod action embed
function modEmbed(action, moderator, target, reason) {
  return new EmbedBuilder()
    .setColor(action === 'ban' ? colors.danger : action === 'kick' ? colors.warning : colors.primary)
    .setTitle(`◉ MOD — ${action.toUpperCase()}`)
    .setDescription([
      '```ansi',
      `\x1b[32m> mod --${action}\x1b[0m`,
      '```',
    ].join('\n'))
    .addFields(
      { name: 'User', value: `${target}`, inline: true },
      { name: 'Moderator', value: `${moderator}`, inline: true },
      { name: 'Reason', value: reason || 'No reason provided', inline: false },
    )
    .setFooter({ text: brand.footer })
    .setTimestamp();
}

// Welcome embed
function welcomeEmbed(member) {
  const memberCount = member.guild.memberCount;
  const ordinal = getOrdinal(memberCount);

  return new EmbedBuilder()
    .setColor(colors.primary)
    .setTitle('◉ INCOMING TRANSMISSION')
    .setDescription([
      `\`\`\`ansi`,
      `\x1b[32m> new_connection --user ${member.user.username}\x1b[0m`,
      `\x1b[32m> MEMBER #${memberCount} — ${ordinal} to join the grid\x1b[0m`,
      `\x1b[32m> STATUS: ONLINE\x1b[0m`,
      `\`\`\``,
      '',
      `Welcome, ${member}! You are viber **#${memberCount}**.`,
      '',
      `▸ Read the rules`,
      `▸ Grab your roles`,
      `▸ Say hello in the lounge`,
    ].join('\n'))
    .setThumbnail(member.user.displayAvatarURL({ size: 256, dynamic: true }))
    .setFooter({ text: brand.footer })
    .setTimestamp();
}

// Goodbye embed
function goodbyeEmbed(member) {
  return new EmbedBuilder()
    .setColor(colors.dim)
    .setTitle('◉ SIGNAL LOST')
    .setDescription([
      `\`\`\`ansi`,
      `\x1b[32m> disconnect --user ${member.user.username}\x1b[0m`,
      `\`\`\``,
      `**${member.user.username}** has left. We're now **${member.guild.memberCount}** vibers.`,
    ].join('\n'))
    .setFooter({ text: brand.footer })
    .setTimestamp();
}

// Level up embed
function levelUpEmbed(user, level, roleName) {
  const embed = new EmbedBuilder()
    .setColor(colors.primary)
    .setTitle('◉ LEVEL UP')
    .setDescription([
      `\`\`\`ansi`,
      `\x1b[32m> levelup --user ${user.username}\x1b[0m`,
      `\x1b[32m> Reached Level ${level}\x1b[0m`,
      `\`\`\``,
      roleName ? `You unlocked the **${roleName}** role!` : '',
    ].filter(Boolean).join('\n'))
    .setFooter({ text: brand.footer })
    .setTimestamp();
  return embed;
}

// Starboard embed
function starboardEmbed(message, stars) {
  const embed = new EmbedBuilder()
    .setColor(colors.primary)
    .setTitle('◉ STARBOARD')
    .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
    .setDescription(message.content || '*[attachment/embed]*')
    .addFields({ name: 'Source', value: `[Jump to message](${message.url})` })
    .setFooter({ text: `⭐ ${stars} stars · ${brand.footer}` })
    .setTimestamp(message.createdAt);

  if (message.attachments.size > 0) {
    const img = message.attachments.find(a => a.contentType?.startsWith('image/'));
    if (img) embed.setImage(img.url);
  }
  return embed;
}

function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

module.exports = {
  vibeEmbed, successEmbed, errorEmbed, modEmbed,
  welcomeEmbed, goodbyeEmbed, levelUpEmbed, starboardEmbed,
};
