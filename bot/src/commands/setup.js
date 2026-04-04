const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { server, colors, brand } = require('../config');
const { updateGuildSetting } = require('../utils/database');
const { vibeEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Nuke all channels and rebuild the server from scratch')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 60,

  async execute(interaction) {
    await interaction.deferReply();
    const guild = interaction.guild;
    const log = [];

    try {
      // ─── Step 1: DELETE all existing channels ──────────────────────────
      await interaction.editReply({ embeds: [vibeEmbed('⚙ SETUP', '```ansi\n\x1b[31m> Purging all channels...\x1b[0m\n```')] });

      const existingChannels = guild.channels.cache.filter(c => c.id !== interaction.channel.id);
      let deleted = 0;
      for (const [, ch] of existingChannels) {
        try { await ch.delete(); deleted++; } catch {}
      }
      log.push(`✓ Purged ${deleted} old channels`);

      // ─── Step 2: Create roles ──────────────────────────────────────────
      await interaction.editReply({ embeds: [vibeEmbed('⚙ SETUP', `\`\`\`ansi\n${log.join('\n')}\n\x1b[32m> Creating roles...\x1b[0m\n\`\`\``)] });

      const createdRoles = {};
      for (const roleDef of [...server.roles].reverse()) {
        const existing = guild.roles.cache.find(r => r.name === roleDef.name);
        if (existing) { createdRoles[roleDef.name] = existing; continue; }

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
      log.push(`✓ ${Object.keys(createdRoles).length} roles set`);

      // ─── Step 3: Build channels ────────────────────────────────────────
      await interaction.editReply({ embeds: [vibeEmbed('⚙ SETUP', `\`\`\`ansi\n${log.join('\n')}\n\x1b[32m> Building channels...\x1b[0m\n\`\`\``)] });

      const modRole = createdRoles['Mod'];
      let chCount = 0;

      for (const cat of server.categories) {
        const permOverwrites = [];
        if (cat.staffOnly) {
          permOverwrites.push({ id: guild.id, deny: [PermissionFlagsBits.ViewChannel] });
          if (modRole) permOverwrites.push({ id: modRole.id, allow: [PermissionFlagsBits.ViewChannel] });
          if (createdRoles['Admin']) permOverwrites.push({ id: createdRoles['Admin'].id, allow: [PermissionFlagsBits.ViewChannel] });
          if (createdRoles['Owner']) permOverwrites.push({ id: createdRoles['Owner'].id, allow: [PermissionFlagsBits.ViewChannel] });
        }

        const category = await guild.channels.create({
          name: cat.name,
          type: ChannelType.GuildCategory,
          permissionOverwrites: permOverwrites,
        });

        for (const ch of cat.channels) {
          const type = ch.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText;
          const newCh = await guild.channels.create({
            name: ch.name,
            type,
            parent: category.id,
            topic: ch.topic || undefined,
          });
          chCount++;

          // Store key channel IDs
          const raw = ch.name.replace(/^.│/, '');
          if (raw === 'welcome' || ch.name.includes('welcome')) updateGuildSetting(guild.id, 'welcome_channel_id', newCh.id);
          if (raw === 'mod-log' || ch.name.includes('mod-log')) updateGuildSetting(guild.id, 'log_channel_id', newCh.id);
        }
      }
      log.push(`✓ ${chCount} channels built`);

      // ─── Step 4: Auto-role ─────────────────────────────────────────────
      const defaultRole = createdRoles['Viber'];
      if (defaultRole) {
        updateGuildSetting(guild.id, 'autorole_id', defaultRole.id);
        log.push('✓ Auto-role → Viber');
      }

      // ─── Step 5: Post rules ────────────────────────────────────────────
      await interaction.editReply({ embeds: [vibeEmbed('⚙ SETUP', `\`\`\`ansi\n${log.join('\n')}\n\x1b[32m> Posting content...\x1b[0m\n\`\`\``)] });

      const rulesChannel = guild.channels.cache.find(c => c.name.includes('rules') && c.type === ChannelType.GuildText);
      if (rulesChannel) {
        await rulesChannel.send({ embeds: [new EmbedBuilder()
          .setColor(colors.primary)
          .setTitle('RULES')
          .setDescription([
            '```ansi',
            '\x1b[32m> rules.sh executed\x1b[0m',
            '```',
            '',
            '`01` Respect everyone. No exceptions.',
            '`02` No spam or flood.',
            '`03` No NSFW, hate, or harassment.',
            '`04` No self-promo without permission.',
            '`05` Right content, right channel.',
            '`06` Staff calls are final.',
            '`07` Keep personal info private.',
            '`08` Vibe hard or go home.',
            '',
            '*Violations = warn → mute → ban.*',
          ].join('\n'))
          .setFooter({ text: brand.footer })
        ] });
        log.push('✓ Rules posted');
      }

      // ─── Step 6: Role picker ───────────────────────────────────────────
      const rolesChannel = guild.channels.cache.find(c => c.name.includes('roles') && c.type === ChannelType.GuildText);
      if (rolesChannel) {
        const colorRoles = ['Neon Green', 'Cyber Cyan', 'Hot Magenta', 'Amber Glow', 'Ghost White'];
        const btnStyles = [ButtonStyle.Success, ButtonStyle.Primary, ButtonStyle.Danger, ButtonStyle.Secondary, ButtonStyle.Secondary];

        const row = new ActionRowBuilder();
        colorRoles.forEach((name, i) => {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`role_${name.replace(/\s/g, '_')}`)
              .setLabel(name)
              .setStyle(btnStyles[i])
          );
        });

        await rolesChannel.send({
          embeds: [new EmbedBuilder()
            .setColor(colors.secondary)
            .setTitle('COLOR SELECT')
            .setDescription([
              '```ansi',
              '\x1b[36m> color_picker.sh\x1b[0m',
              '```',
              'Tap a button. Tap again to remove.',
            ].join('\n'))
          ],
          components: [row],
        });
        log.push('✓ Role picker posted');
      }

      // ─── Step 7: Ticket button ─────────────────────────────────────────
      const botCh = guild.channels.cache.find(c => c.name.includes('bot-cmds') && c.type === ChannelType.GuildText);
      if (botCh) {
        await botCh.send({
          embeds: [new EmbedBuilder()
            .setColor(colors.accent)
            .setTitle('SUPPORT')
            .setDescription([
              '```ansi',
              '\x1b[35m> ticket_system.sh\x1b[0m',
              '```',
              'Need help? Open a private ticket with staff.',
            ].join('\n'))
          ],
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('ticket_create')
              .setLabel('Open Ticket')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('🎫')
          )],
        });
        log.push('✓ Ticket system posted');
      }

      // ─── Done ──────────────────────────────────────────────────────────
      updateGuildSetting(guild.id, 'setup_complete', 1);

      // Delete the setup channel (we're in it and it's from the old layout)
      // Send final message to general instead
      const generalCh = guild.channels.cache.find(c => c.name.includes('general') && c.type === ChannelType.GuildText);
      const target = generalCh || interaction.channel;

      await target.send({ embeds: [new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle('✓ SERVER INITIALIZED')
        .setDescription([
          '```ansi',
          '\x1b[32m' + log.join('\n') + '\x1b[0m',
          '```',
          '',
          '**System online.** All channels, roles, and systems are live.',
          '',
          '`/help` — see all commands',
        ].join('\n'))
        .setFooter({ text: brand.footer })
        .setTimestamp()
      ] });

      // Try to delete the channel we ran setup in (old leftover)
      try {
        if (interaction.channel.id !== target.id) {
          await interaction.channel.delete();
        } else {
          await interaction.editReply({ content: '`✓ Done.`', embeds: [] });
        }
      } catch {
        await interaction.editReply({ content: '`✓ Done. You can delete this old channel.`', embeds: [] });
      }

    } catch (err) {
      console.error('[SETUP ERROR]', err);
      await interaction.editReply({
        embeds: [vibeEmbed('⚠ ERROR', `\`\`\`ansi\n\x1b[31m${err.message}\x1b[0m\n\`\`\`\n\n${log.map(l => `▸ ${l}`).join('\n')}`)],
      }).catch(() => {});
    }
  },
};
