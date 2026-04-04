// ─── VIBE Color Palette ──────────────────────────────────────────────────────
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
  },

  brand: {
    name: 'VIBE',
    tagline: 'T E R M I N A L  ·  v 2 . 0',
    footer: 'VIBE TERMINAL v2.0',
    emoji: {
      bar:      '█',
      barEmpty: '░',
      star:     '⭐',
      bolt:     '⚡',
      shield:   '🛡️',
      ticket:   '🎫',
      crown:    '👑',
      wave:     '👋',
      fire:     '🔥',
      check:    '✓',
      cross:    '✗',
      gear:     '⚙',
    },
  },

  // ─── Streamlined server layout ─────────────────────────────────────────────
  // Minimal. Clean. No clutter.
  server: {
    categories: [
      {
        name: '〔 SYSTEM 〕',
        channels: [
          { name: '📋│rules', type: 'text', topic: 'Read before proceeding.' },
          { name: '🎨│roles', type: 'text', topic: 'Pick your color.' },
          { name: '👋│welcome', type: 'text', topic: 'New connections appear here.' },
        ],
      },
      {
        name: '〔 MAIN 〕',
        channels: [
          { name: '💬│general', type: 'text', topic: 'Main chat. Keep the vibe clean.' },
          { name: '🤖│bot-cmds', type: 'text', topic: 'Bot commands go here.' },
          { name: '📸│media', type: 'text', topic: 'Images, links, videos.' },
        ],
      },
      {
        name: '〔 CONNECT 〕',
        channels: [
          { name: 'Lounge', type: 'voice' },
          { name: 'Session', type: 'voice' },
        ],
      },
      {
        name: '〔 STAFF 〕',
        staffOnly: true,
        channels: [
          { name: '🔒│mod-log', type: 'text', topic: 'Action logs.' },
        ],
      },
    ],
    roles: [
      { name: '── STAFF ──', color: null, hoist: false, separator: true },
      { name: 'Owner', color: 0xFF00FF, hoist: true, permissions: ['Administrator'] },
      { name: 'Admin', color: 0x00E5FF, hoist: true, permissions: ['Administrator'] },
      { name: 'Mod', color: 0x00FF41, hoist: true, permissions: ['KickMembers', 'BanMembers', 'ManageMessages', 'MuteMembers', 'ManageNicknames'] },
      { name: '── RANK ──', color: null, hoist: false, separator: true },
      { name: '⚡ Legendary', color: 0xFF00FF, hoist: true },
      { name: '🔥 Elite', color: 0xFF3C3C, hoist: true },
      { name: '✦ Veteran', color: 0xFFB000, hoist: false },
      { name: '── COLOR ──', color: null, hoist: false, separator: true },
      { name: 'Neon Green', color: 0x00FF41, hoist: false },
      { name: 'Cyber Cyan', color: 0x00E5FF, hoist: false },
      { name: 'Hot Magenta', color: 0xFF00FF, hoist: false },
      { name: 'Amber Glow', color: 0xFFB000, hoist: false },
      { name: 'Ghost White', color: 0xCCCCCC, hoist: false },
      { name: '───────', color: null, hoist: false, separator: true },
      { name: 'Viber', color: 0x00AA2A, hoist: false, isDefault: true },
    ],
  },

  leveling: {
    xpPerMessage: [15, 25],
    cooldownSeconds: 60,
    levels: [
      { level: 10, role: '✦ Veteran' },
      { level: 25, role: '🔥 Elite' },
      { level: 50, role: '⚡ Legendary' },
    ],
  },

  starboard: {
    threshold: 3,
    emoji: '⭐',
  },
};
