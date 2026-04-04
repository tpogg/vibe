const { EmbedBuilder } = require('discord.js');
const { colors, brand } = require('../config');

// Standard VIBE-branded embed
function vibeEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(colors.primary)
    .setTitle(title ? `${title}` : null)
    .setDescription(description || null)
    .setFooter({ text: brand.footer })
    .setTimestamp();
}

// Success embed
function successEmbed(description) {
  return new EmbedBuilder()
    .setColor(colors.primary)
    .setDescription(`\`\`\`ansi\n\x1b[32m${brand.emoji.check} ${description}\x1b[0m\n\`\`\``)
    .setTimestamp();
}

// Error embed
function errorEmbed(description) {
  return new EmbedBuilder()
    .setColor(colors.danger)
    .setDescription(`\`\`\`ansi\n\x1b[31m${brand.emoji.cross} ${description}\x1b[0m\n\`\`\``)
    .setTimestamp();
}

// Mod action embed
function modEmbed(action, moderator, target, reason) {
  return new EmbedBuilder()
    .setColor(action === 'ban' ? colors.danger : action === 'kick' ? colors.warning : colors.secondary)
    .setTitle(`${brand.emoji.shield} Moderation — ${action.toUpperCase()}`)
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
    .setTitle(`${brand.emoji.wave}  Welcome to the VIBE`)
    .setDescription([
      `\`\`\`ansi`,
      `\x1b[32m> INCOMING TRANSMISSION...\x1b[0m`,
      `\x1b[32m> NEW USER DETECTED: \x1b[1;36m${member.user.username}\x1b[0m`,
      `\x1b[32m> MEMBER #${memberCount} — ${ordinal} to join the grid\x1b[0m`,
      `\x1b[32m> STATUS: \x1b[1;33mONLINE\x1b[0m`,
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
    .setDescription([
      `\`\`\`ansi`,
      `\x1b[33m> SIGNAL LOST: \x1b[1;37m${member.user.username}\x1b[0m`,
      `\x1b[33m> DISCONNECTED FROM THE GRID\x1b[0m`,
      `\`\`\``,
      `**${member.user.username}** has left. We're now **${member.guild.memberCount}** vibers.`,
    ].join('\n'))
    .setTimestamp();
}

// Level up embed
function levelUpEmbed(user, level, roleName) {
  const embed = new EmbedBuilder()
    .setColor(colors.accent)
    .setDescription([
      `\`\`\`ansi`,
      `\x1b[35m⚡ LEVEL UP!\x1b[0m`,
      `\x1b[35m> ${user.username} reached \x1b[1;33mLevel ${level}\x1b[0m`,
      `\`\`\``,
      roleName ? `You unlocked the **${roleName}** role!` : '',
    ].filter(Boolean).join('\n'));
  return embed;
}

// Starboard embed
function starboardEmbed(message, stars) {
  const embed = new EmbedBuilder()
    .setColor(colors.warning)
    .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
    .setDescription(message.content || '*[attachment/embed]*')
    .addFields({ name: 'Source', value: `[Jump to message](${message.url})` })
    .setFooter({ text: `⭐ ${stars} stars` })
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
