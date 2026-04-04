// ─── VIBE Color Palette ──────────────────────────────────────────────────────
// Matches the retro-futuristic terminal aesthetic
module.exports = {
  colors: {
    primary:  0x00FF41,  // Neon green
    secondary: 0x00E5FF, // Cyan
    accent:   0xFF00FF,  // Magenta
    warning:  0xFFB000,  // Amber
    danger:   0xFF3C3C,  // Red
    dark:     0x0A0A0A,  // Terminal black
    dim:      0x00AA2A,  // Dim green
    white:    0xFFFFFF,
    embed:    0x0A0A0A,  // Embed background feel
  },

  // Branding
  brand: {
    name: 'VIBE',
    tagline: 'T E R M I N A L  ·  v 2 . 0',
    footer: 'VIBE TERMINAL v2.0 — the future is now',
    emoji: {
      online:   '◉',
      offline:  '○',
      arrow:    '▸',
      bar:      '█',
      barEmpty: '░',
      dot:      '·',
      line:     '─',
      star:     '⭐',
      bolt:     '⚡',
      shield:   '🛡️',
      ticket:   '🎫',
      crown:    '👑',
      wave:     '👋',
      music:    '🎵',
      fire:     '🔥',
      check:    '✓',
      cross:    '✗',
      gear:     '⚙',
    },
  },

  // Server setup template
  server: {
    categories: [
      {
        name: '═══ WELCOME ═══',
        channels: [
          { name: 'rules', type: 'text', topic: 'Read the rules before proceeding. Respect the vibe.' },
          { name: 'welcome', type: 'text', topic: 'Say hello to new vibers.' },
          { name: 'roles', type: 'text', topic: 'Pick your roles and colors.' },
        ],
      },
      {
        name: '═══ GENERAL ═══',
        channels: [
          { name: 'lounge', type: 'text', topic: 'Main hangout — keep the vibe immaculate.' },
          { name: 'media', type: 'text', topic: 'Share images, videos, and links.' },
          { name: 'bot-commands', type: 'text', topic: 'Use bot commands here.' },
        ],
      },
      {
        name: '═══ COMMUNITY ═══',
        channels: [
          { name: 'showcase', type: 'text', topic: 'Show off your work, projects, and creations.' },
          { name: 'suggestions', type: 'text', topic: 'Ideas to improve the server.' },
          { name: 'starboard', type: 'text', topic: '⭐ The best messages, voted by the community.' },
        ],
      },
      {
        name: '═══ VOICE ═══',
        channels: [
          { name: 'Lounge', type: 'voice' },
          { name: 'Gaming', type: 'voice' },
          { name: 'Music', type: 'voice' },
        ],
      },
      {
        name: '═══ STAFF ═══',
        staffOnly: true,
        channels: [
          { name: 'mod-chat', type: 'text', topic: 'Staff discussion.' },
          { name: 'logs', type: 'text', topic: 'Automated action logs.' },
          { name: 'tickets', type: 'text', topic: 'Support ticket logs.' },
        ],
      },
    ],
    roles: [
      { name: '──── STAFF ────', color: null, hoist: false, separator: true },
      { name: 'Owner', color: 0xFF00FF, hoist: true, permissions: ['Administrator'] },
      { name: 'Admin', color: 0x00E5FF, hoist: true, permissions: ['Administrator'] },
      { name: 'Moderator', color: 0x00FF41, hoist: true, permissions: ['KickMembers', 'BanMembers', 'ManageMessages', 'MuteMembers', 'ManageNicknames'] },
      { name: '──── LEVELS ────', color: null, hoist: false, separator: true },
      { name: '⚡ Legendary', color: 0xFF00FF, hoist: true },
      { name: '🔥 Elite', color: 0xFF3C3C, hoist: true },
      { name: '✦ Veteran', color: 0xFFB000, hoist: true },
      { name: '◈ Regular', color: 0x00E5FF, hoist: false },
      { name: '──── COLORS ────', color: null, hoist: false, separator: true },
      { name: 'Neon Green', color: 0x00FF41, hoist: false },
      { name: 'Cyber Cyan', color: 0x00E5FF, hoist: false },
      { name: 'Hot Magenta', color: 0xFF00FF, hoist: false },
      { name: 'Amber Glow', color: 0xFFB000, hoist: false },
      { name: 'Red Alert', color: 0xFF3C3C, hoist: false },
      { name: 'Ghost White', color: 0xCCCCCC, hoist: false },
      { name: '────────────', color: null, hoist: false, separator: true },
      { name: 'Viber', color: 0x00AA2A, hoist: false, isDefault: true },
    ],
  },

  // XP / Leveling
  leveling: {
    xpPerMessage: [15, 25],  // Random between these
    cooldownSeconds: 60,
    levels: [
      { level: 5,  role: '◈ Regular' },
      { level: 15, role: '✦ Veteran' },
      { level: 30, role: '🔥 Elite' },
      { level: 50, role: '⚡ Legendary' },
    ],
  },

  // Starboard
  starboard: {
    threshold: 3,
    emoji: '⭐',
  },
};
