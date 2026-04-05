const { EmbedBuilder } = require('discord.js');
const { leveling, colors, brand } = require('../config');
const { addXp, getXp, setLevel, getGuildSettings } = require('../utils/database');
const { levelUpEmbed } = require('../utils/embeds');

// ─── NSFW / Gore keyword detection ──────────────────────────────────────────
const BANNED_WORDS = [
  'porn', 'pornography', 'hentai', 'xxx', 'nsfw', 'nude', 'nudes',
  'nudity', 'naked', 'gore', 'gory', 'dismember', 'beheading',
  'snuff', 'cp', 'child porn', 'loli', 'onlyfans leak',
];
const BANNED_REGEX = new RegExp(`\\b(${BANNED_WORDS.join('|')})\\b`, 'i');

module.exports = {
  name: 'messageCreate',
  once: false,

  async execute(message) {
    if (message.author.bot || !message.guild) return;

    // ─── NSFW / Gore Auto-ban ───────────────────────────────────────────
    const member = message.guild.members.cache.get(message.author.id);
    const isStaff = member?.permissions.has('ManageMessages');

    if (!isStaff) {
      // Check text content
      const textBanned = BANNED_REGEX.test(message.content);

      // Check for NSFW image attachments (Discord auto-flags explicit content)
      const nsfwAttachment = message.attachments.some(a => a.contentType?.startsWith('image/') && a.flags?.has?.('IS_EXPLICIT'));

      // Check embeds for NSFW
      const nsfwEmbed = message.embeds.some(e => {
        const text = `${e.title || ''} ${e.description || ''} ${e.url || ''}`.toLowerCase();
        return BANNED_REGEX.test(text);
      });

      if (textBanned || nsfwAttachment || nsfwEmbed) {
        try {
          await message.delete();
        } catch {}

        try {
          await member.ban({ reason: 'Auto-ban: NSFW/Gore content detected', deleteMessageSeconds: 86400 });
        } catch (err) {
          console.error('[AUTOMOD:BAN]', err.message);
        }

        // Log it
        const settings = getGuildSettings(message.guild.id);
        if (settings?.log_channel_id) {
          const logCh = message.guild.channels.cache.get(settings.log_channel_id);
          if (logCh) {
            const logEmbed = new EmbedBuilder()
              .setColor(colors.danger)
              .setTitle('🛡️ AUTO-BAN — NSFW/GORE')
              .addFields(
                { name: 'User', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: true },
                { name: 'Channel', value: `#${message.channel.name}`, inline: true },
                { name: 'Content', value: message.content?.slice(0, 200) || '*[attachment]*', inline: false },
              )
              .setFooter({ text: brand.footer })
              .setTimestamp();
            logCh.send({ embeds: [logEmbed] }).catch(() => {});
          }
        }

        return; // Stop processing — user is banned
      }
    }

    // ─── XP / Leveling ─────────────────────────────────────────────────
    const now = Math.floor(Date.now() / 1000);
    const existing = getXp(message.author.id, message.guild.id);
    const lastXp = existing?.last_xp_at || 0;

    if (now - lastXp >= leveling.cooldownSeconds) {
      const [min, max] = leveling.xpPerMessage;
      const xpGain = Math.floor(Math.random() * (max - min + 1)) + min;
      const data = addXp(message.author.id, message.guild.id, xpGain);

      // Check for level up
      const newLevel = calculateLevel(data.xp);
      if (newLevel > data.level) {
        setLevel(message.author.id, message.guild.id, newLevel);

        // Check for role reward
        const reward = leveling.levels.find(l => l.level === newLevel);
        let roleName = null;

        if (reward) {
          const role = message.guild.roles.cache.find(r => r.name === reward.role);
          if (role) {
            try {
              await message.member.roles.add(role);
              roleName = reward.role;
            } catch {}
          }
        }

        // Send level-up message
        try {
          await message.channel.send({
            embeds: [levelUpEmbed(message.author, newLevel, roleName)],
          });
        } catch {}
      }
    }

    // ─── Basic Auto-mod ─────────────────────────────────────────────────
    // Anti mass-mention
    if (message.mentions.users.size >= 5 || message.mentions.roles.size >= 3) {
      const member = message.guild.members.cache.get(message.author.id);
      if (member && !member.permissions.has('ManageMessages')) {
        try {
          await message.delete();
          await message.channel.send({
            content: `\`⚠ ${message.author.username}, mass-mentioning is not allowed.\``,
          }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
        } catch {}
      }
    }
  },
};

function calculateLevel(xp) {
  let level = 0;
  while (100 * (level + 1) * (level + 1) <= xp) {
    level++;
  }
  return level;
}
