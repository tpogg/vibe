const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { server, colors, brand } = require('../config');
const { updateGuildSetting } = require('../utils/database');
const { generateBanner, generateIcon } = require('../utils/canvas');
const { vibeEmbed, successEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Auto-configure the entire server with the VIBE aesthetic')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 60,

  async execute(interaction) {
    await interaction.deferReply();

    const guild = interaction.guild;
    const log = [];

    try {
      // ─── Step 1: Set server icon & banner ────────────────────────────
      await interaction.editReply({ embeds: [vibeEmbed('⚙ SETUP', '```ansi\n\x1b[32m> Generating server branding...\x1b[0m\n```')] });

      try {
        const icon = generateIcon('V');
        await guild.setIcon(icon);
        log.push('✓ Server icon set');
      } catch (e) {
        log.push('⚠ Could not set server icon (may need Boost level)');
      }

      try {
        const banner = generateBanner('VIBE');
        await guild.setBanner(banner);
        log.push('✓ Server banner set');
      } catch (e) {
        log.push('⚠ Could not set banner (requires Boost Level 2)');
      }

      // ─── Step 2: Create roles ────────────────────────────────────────
      await interaction.editReply({ embeds: [vibeEmbed('⚙ SETUP', `\`\`\`ansi\n${log.join('\n')}\n\x1b[32m> Creating roles...\x1b[0m\n\`\`\``)] });

      const createdRoles = {};
      const existingRoles = guild.roles.cache;

      for (const roleDef of [...server.roles].reverse()) {
        const existing = existingRoles.find(r => r.name === roleDef.name);
        if (existing) {
          createdRoles[roleDef.name] = existing;
          continue;
        }

        const perms = [];
        if (roleDef.permissions) {
          for (const p of roleDef.permissions) {
            if (PermissionFlagsBits[p]) perms.push(PermissionFlagsBits[p]);
          }
        }

        try {
          const role = await guild.roles.create({
            name: roleDef.name,
            color: roleDef.color || undefined,
            hoist: roleDef.hoist || false,
            permissions: roleDef.separator ? [] : perms.length ? perms : undefined,
            mentionable: false,
          });
          createdRoles[roleDef.name] = role;
        } catch {}
      }
      log.push(`✓ ${Object.keys(createdRoles).length} roles configured`);

      // ─── Step 3: Create channels ─────────────────────────────────────
      await interaction.editReply({ embeds: [vibeEmbed('⚙ SETUP', `\`\`\`ansi\n${log.join('\n')}\n\x1b[32m> Building channel structure...\x1b[0m\n\`\`\``)] });

      const modRole = createdRoles['Moderator'];
      let channelCount = 0;

      for (const cat of server.categories) {
        // Check if category already exists
        let category = guild.channels.cache.find(
          c => c.name === cat.name && c.type === ChannelType.GuildCategory
        );

        if (!category) {
          const permOverwrites = [];
          if (cat.staffOnly && modRole) {
            permOverwrites.push(
              { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
              { id: modRole.id, allow: [PermissionFlagsBits.ViewChannel] },
            );
            // Also allow Admin and Owner roles
            if (createdRoles['Admin']) {
              permOverwrites.push({ id: createdRoles['Admin'].id, allow: [PermissionFlagsBits.ViewChannel] });
            }
            if (createdRoles['Owner']) {
              permOverwrites.push({ id: createdRoles['Owner'].id, allow: [PermissionFlagsBits.ViewChannel] });
            }
          }

          category = await guild.channels.create({
            name: cat.name,
            type: ChannelType.GuildCategory,
            permissionOverwrites: permOverwrites,
          });
        }

        for (const ch of cat.channels) {
          const existing = guild.channels.cache.find(
            c => c.name === ch.name && c.parentId === category.id
          );
          if (existing) {
            channelCount++;
            // Store special channel IDs
            if (ch.name === 'welcome') updateGuildSetting(guild.id, 'welcome_channel_id', existing.id);
            if (ch.name === 'logs') updateGuildSetting(guild.id, 'log_channel_id', existing.id);
            if (ch.name === 'starboard') updateGuildSetting(guild.id, 'starboard_channel_id', existing.id);
            continue;
          }

          const type = ch.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText;
          const newCh = await guild.channels.create({
            name: ch.name,
            type,
            parent: category.id,
            topic: ch.topic || undefined,
          });
          channelCount++;

          // Store special channels
          if (ch.name === 'welcome') updateGuildSetting(guild.id, 'welcome_channel_id', newCh.id);
          if (ch.name === 'logs') updateGuildSetting(guild.id, 'log_channel_id', newCh.id);
          if (ch.name === 'starboard') updateGuildSetting(guild.id, 'starboard_channel_id', newCh.id);
        }
      }
      log.push(`✓ ${channelCount} channels configured`);

      // ─── Step 4: Set auto-role ───────────────────────────────────────
      const defaultRole = createdRoles['Viber'];
      if (defaultRole) {
        updateGuildSetting(guild.id, 'autorole_id', defaultRole.id);
        log.push('✓ Auto-role set to "Viber"');
      }

      // ─── Step 5: Post rules embed ───────────────────────────────────
      await interaction.editReply({ embeds: [vibeEmbed('⚙ SETUP', `\`\`\`ansi\n${log.join('\n')}\n\x1b[32m> Posting welcome content...\x1b[0m\n\`\`\``)] });

      const rulesChannel = guild.channels.cache.find(c => c.name === 'rules' && c.type === ChannelType.GuildText);
      if (rulesChannel) {
        const rulesEmbed = new EmbedBuilder()
          .setColor(colors.primary)
          .setTitle('📜  SERVER RULES')
          .setDescription([
            '```ansi',
            '\x1b[32m> RULES.exe loaded successfully\x1b[0m',
            '\x1b[32m> Please read before proceeding\x1b[0m',
            '```',
            '',
            '**1.** Be respectful — keep the vibe positive',
            '**2.** No spam, flooding, or excessive caps',
            '**3.** No NSFW, hate speech, or harassment',
            '**4.** No self-promotion without permission',
            '**5.** Keep content in the right channels',
            '**6.** Listen to staff — their word is final',
            '**7.** No doxxing or sharing personal info',
            '**8.** Have fun and keep the energy up',
            '',
            '*Breaking rules may result in warnings, mutes, or bans.*',
          ].join('\n'))
          .setFooter({ text: brand.footer })
          .setColor(colors.primary);

        await rulesChannel.send({ embeds: [rulesEmbed] });
        log.push('✓ Rules posted');
      }

      // ─── Step 6: Post role picker ────────────────────────────────────
      const rolesChannel = guild.channels.cache.find(c => c.name === 'roles' && c.type === ChannelType.GuildText);
      if (rolesChannel) {
        const colorRoles = ['Neon Green', 'Cyber Cyan', 'Hot Magenta', 'Amber Glow', 'Red Alert', 'Ghost White'];
        const roleEmbed = new EmbedBuilder()
          .setColor(colors.secondary)
          .setTitle('🎨  PICK YOUR COLOR')
          .setDescription([
            '```ansi',
            '\x1b[36m> COLOR_SELECTOR.exe\x1b[0m',
            '\x1b[36m> Click a button to get your color role\x1b[0m',
            '```',
            '',
            colorRoles.map(r => `▸ **${r}**`).join('\n'),
          ].join('\n'))
          .setFooter({ text: 'Click again to remove the role' });

        const rows = [];
        const btnColors = [ButtonStyle.Success, ButtonStyle.Primary, ButtonStyle.Danger, ButtonStyle.Secondary, ButtonStyle.Danger, ButtonStyle.Secondary];
        const row = new ActionRowBuilder();
        colorRoles.forEach((name, i) => {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`role_${name.replace(/\s/g, '_')}`)
              .setLabel(name)
              .setStyle(btnColors[i] || ButtonStyle.Secondary)
          );
          if ((i + 1) % 5 === 0 || i === colorRoles.length - 1) {
            rows.push(ActionRowBuilder.from(row));
          }
        });

        // Rebuild rows properly (max 5 buttons each)
        const properRows = [];
        let currentRow = new ActionRowBuilder();
        colorRoles.forEach((name, i) => {
          currentRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`role_${name.replace(/\s/g, '_')}`)
              .setLabel(name)
              .setStyle(btnColors[i] || ButtonStyle.Secondary)
          );
          if ((i + 1) % 5 === 0 || i === colorRoles.length - 1) {
            properRows.push(currentRow);
            currentRow = new ActionRowBuilder();
          }
        });

        await rolesChannel.send({ embeds: [roleEmbed], components: properRows });
        log.push('✓ Role picker posted');
      }

      // ─── Step 7: Post ticket button ──────────────────────────────────
      const botCmdsChannel = guild.channels.cache.find(c => c.name === 'bot-commands' && c.type === ChannelType.GuildText);
      if (botCmdsChannel) {
        const ticketEmbed = new EmbedBuilder()
          .setColor(colors.accent)
          .setTitle('🎫  SUPPORT TICKETS')
          .setDescription([
            '```ansi',
            '\x1b[35m> TICKET_SYSTEM.exe\x1b[0m',
            '\x1b[35m> Click below to open a support ticket\x1b[0m',
            '```',
            '',
            'Need help? Click the button below to create a private ticket with staff.',
          ].join('\n'));

        const ticketRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('ticket_create')
            .setLabel('Open Ticket')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎫')
        );

        await botCmdsChannel.send({ embeds: [ticketEmbed], components: [ticketRow] });
        log.push('✓ Ticket system posted');
      }

      // ─── Done ────────────────────────────────────────────────────────
      updateGuildSetting(guild.id, 'setup_complete', 1);

      const finalEmbed = new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle('✓  SETUP COMPLETE')
        .setDescription([
          '```ansi',
          '\x1b[32m' + log.join('\n') + '\x1b[0m',
          '```',
          '',
          '**Your server is now fully configured!**',
          '',
          '▸ Channels, roles, and permissions are set',
          '▸ Welcome system is active',
          '▸ Role picker is in #roles',
          '▸ Ticket system is in #bot-commands',
          '▸ Starboard is watching for ⭐ reactions',
          '▸ XP/leveling system is active',
          '',
          '*Use `/help` to see all available commands.*',
        ].join('\n'))
        .setFooter({ text: brand.footer })
        .setTimestamp();

      await interaction.editReply({ embeds: [finalEmbed] });

    } catch (err) {
      console.error('[SETUP ERROR]', err);
      await interaction.editReply({
        embeds: [vibeEmbed('⚠ SETUP ERROR', `\`\`\`ansi\n\x1b[31m${err.message}\x1b[0m\n\`\`\`\n\nPartial progress:\n${log.map(l => `▸ ${l}`).join('\n')}`)],
      });
    }
  },
};
