const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { colors, brand } = require('../config');
const { getGuildSettings } = require('../utils/database');

const MIN_ACCOUNT_AGE_DAYS = 3;
const MAX_ATTEMPTS = 3;
const CAPTCHA_EXPIRY_MS = 120_000; // 2 minutes

// In-memory captcha store
const captchaStore = new Map();
const attemptStore = new Map();

// Generate a human-readable but bot-resistant code
function generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Get the "scrambled" display version (harder for bots to OCR from text)
function scrambleDisplay(code) {
  const spacers = ['​', ' ', '‎', ' ']; // zero-width chars mixed with spaces
  return code.split('').map((c, i) => {
    const spacer = spacers[i % spacers.length];
    return `**${c}**${spacer}`;
  }).join('');
}

async function handleButton(interaction) {
  if (interaction.customId !== 'verify_start') return false;

  const member = interaction.member;
  const userId = interaction.user.id;

  // Check account age
  const accountAge = Date.now() - interaction.user.createdTimestamp;
  const ageDays = accountAge / (1000 * 60 * 60 * 24);

  if (ageDays < MIN_ACCOUNT_AGE_DAYS) {
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(colors.danger)
        .setTitle('◉ ACCESS DENIED')
        .setDescription([
          '```ansi', '\x1b[32m> verify --check\x1b[0m', '```',
          `Your account is **${Math.floor(ageDays)}** days old.`,
          `Minimum required: **${MIN_ACCOUNT_AGE_DAYS}** days.`,
          '', 'Come back later.',
        ].join('\n'))
        .setFooter({ text: brand.footer })
        .setTimestamp()
      ],
      ephemeral: true,
    });
    return true;
  }

  // Check if already verified
  const settings = getGuildSettings(interaction.guild.id);
  const verifiedRole = interaction.guild.roles.cache.find(r => r.name === 'Viber');
  if (verifiedRole && member.roles.cache.has(verifiedRole.id)) {
    await interaction.reply({ content: '`✓ You are already verified.`', ephemeral: true });
    return true;
  }

  // Check attempt limit
  const attempts = attemptStore.get(userId) || 0;
  if (attempts >= MAX_ATTEMPTS) {
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(colors.danger)
        .setTitle('◉ RATE LIMITED')
        .setDescription('```ansi\n\x1b[32m> verify --check\x1b[0m\n```\nToo many attempts. You have been rate-limited. Try again later.')
        .setFooter({ text: brand.footer })
        .setTimestamp()
      ],
      ephemeral: true,
    });
    return true;
  }

  // Generate CAPTCHA and show modal
  const code = generateCaptcha();
  captchaStore.set(userId, { code, expires: Date.now() + CAPTCHA_EXPIRY_MS });

  const modal = new ModalBuilder()
    .setCustomId('verify_captcha_modal')
    .setTitle('VERIFICATION');

  const codeInput = new TextInputBuilder()
    .setCustomId('captcha_input')
    .setLabel(`Enter this code: ${code}`)
    .setPlaceholder('Type the 6-character code exactly')
    .setStyle(TextInputStyle.Short)
    .setMinLength(6)
    .setMaxLength(6)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(codeInput));
  await interaction.showModal(modal);
  return true;
}

async function handleModal(interaction) {
  if (interaction.customId !== 'verify_captcha_modal') return false;

  const userId = interaction.user.id;
  const input = interaction.fields.getTextInputValue('captcha_input').trim().toUpperCase();
  const entry = captchaStore.get(userId);

  // Expired or no entry
  if (!entry || Date.now() > entry.expires) {
    captchaStore.delete(userId);
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(colors.warning)
        .setTitle('◉ CODE EXPIRED')
        .setDescription('```ansi\n\x1b[32m> verify --validate\x1b[0m\n```\nClick the verify button to get a new code.')
        .setFooter({ text: brand.footer })
        .setTimestamp()
      ],
      ephemeral: true,
    });
    return true;
  }

  // Wrong code
  if (input !== entry.code) {
    const attempts = (attemptStore.get(userId) || 0) + 1;
    attemptStore.set(userId, attempts);
    captchaStore.delete(userId);

    // Clear attempts after 10 minutes
    setTimeout(() => attemptStore.delete(userId), 600_000);

    const remaining = MAX_ATTEMPTS - attempts;
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(colors.danger)
        .setTitle('◉ INCORRECT CODE')
        .setDescription([
          '```ansi', '\x1b[32m> verify --validate\x1b[0m', '```',
          remaining > 0
            ? `**${remaining}** attempt(s) remaining. Click verify to try again.`
            : 'Too many failures. You are temporarily locked out.',
        ].join('\n'))
        .setFooter({ text: brand.footer })
        .setTimestamp()
      ],
      ephemeral: true,
    });
    return true;
  }

  // ─── SUCCESS ───────────────────────────────────────────────────────
  captchaStore.delete(userId);
  attemptStore.delete(userId);

  // Grant verified role
  const verifiedRole = interaction.guild.roles.cache.find(r => r.name === 'Viber');
  if (verifiedRole) {
    try {
      await interaction.member.roles.add(verifiedRole);
    } catch (err) {
      console.error('[VERIFY]', err.message);
    }
  }

  await interaction.reply({
    embeds: [new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle('◉ ACCESS GRANTED')
      .setDescription([
        '```ansi', '\x1b[32m> verify --success\x1b[0m', '```',
        `Welcome to the grid, **${interaction.user.username}**.`,
        'You now have full access to the server.',
      ].join('\n'))
      .setFooter({ text: brand.footer })
      .setTimestamp()
    ],
    ephemeral: true,
  });

  // Log to mod-log
  const settings = getGuildSettings(interaction.guild.id);
  if (settings?.log_channel_id) {
    const logCh = interaction.guild.channels.cache.get(settings.log_channel_id);
    if (logCh) {
      const ageDays = Math.floor((Date.now() - interaction.user.createdTimestamp) / 86400000);
      await logCh.send({
        embeds: [new EmbedBuilder()
          .setColor(colors.primary)
          .setDescription(`\`✓\` **${interaction.user.tag}** verified (account age: ${ageDays}d)`)
          .setTimestamp()
        ],
        flags: [MessageFlags.SuppressNotifications],
      }).catch(() => {});
    }
  }

  return true;
}

module.exports = { handleButton, handleModal };
