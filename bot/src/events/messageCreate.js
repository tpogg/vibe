const { leveling } = require('../config');
const { addXp, getXp, setLevel, getGuildSettings } = require('../utils/database');
const { levelUpEmbed } = require('../utils/embeds');

module.exports = {
  name: 'messageCreate',
  once: false,

  async execute(message) {
    if (message.author.bot || !message.guild) return;

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
