const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ForumLayoutType, AutoModerationRuleTriggerType, AutoModerationRuleEventType, AutoModerationActionType } = require('discord.js');
const { server, colors, brand } = require('../config');
const { updateGuildSetting } = require('../utils/database');
const { vibeEmbed } = require('../utils/embeds');

const TYPE_MAP = {
  text:  ChannelType.GuildText,
  voice: ChannelType.GuildVoice,
  forum: ChannelType.GuildForum,
  stage: ChannelType.GuildStageVoice,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Nuke all channels and rebuild the server from scratch')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 60,

  async execute(interaction) {
    await interaction.deferReply();
    const guild = interaction.guild;
    const safeReply = (opts) => interaction.editReply(opts).catch(() => {});
    const log = [];

    try {
      // ─── Step 1: NUKE ──────────────────────────────────────────────────
      await safeReply({ embeds: [vibeEmbed('SETUP', '```ansi\n\x1b[31m> rm -rf ./channels/*\x1b[0m\n```')] });

      const existing = guild.channels.cache.filter(c => c.id !== interaction.channel.id);
      let deleted = 0;
      for (const [, ch] of existing) {
        try { await ch.delete(); deleted++; } catch {}
      }
      log.push(`✓ Purged ${deleted} channels`);

      // ─── Step 2: ROLES ─────────────────────────────────────────────────
      await safeReply({ embeds: [vibeEmbed('SETUP', `\`\`\`ansi\n${log.join('\n')}\n\x1b[32m> Creating roles...\x1b[0m\n\`\`\``)] });

      const createdRoles = {};
      for (const def of [...server.roles].reverse()) {
        const ex = guild.roles.cache.find(r => r.name === def.name);
        if (ex) { createdRoles[def.name] = ex; continue; }

        const perms = (def.permissions || []).filter(p => PermissionFlagsBits[p]).map(p => PermissionFlagsBits[p]);
        try {
          createdRoles[def.name] = await guild.roles.create({
            name: def.name,
            color: def.color || undefined,
            hoist: def.hoist || false,
            permissions: def.separator ? [] : perms.length ? perms : undefined,
            mentionable: false,
          });
        } catch {}
      }
      log.push(`✓ ${Object.keys(createdRoles).length} roles`);

      // ─── Step 3: VERIFICATION CHANNEL ──────────────────────────────────
      await safeReply({ embeds: [vibeEmbed('SETUP', `\`\`\`ansi\n${log.join('\n')}\n\x1b[32m> mkdir -p channels/*\x1b[0m\n\`\`\``)] });

      const modRole = createdRoles['Mod'];
      const viberRole = createdRoles['Viber'];
      let chCount = 0;

      // Create verify channel — visible to EVERYONE, even unverified
      const verifyCh = await guild.channels.create({
        name: '🔐│verify',
        type: ChannelType.GuildText,
        topic: 'Verify to access the server.',
        permissionOverwrites: [
          { id: guild.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
          { id: guild.members.me.id, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel] },
          // Verified users don't need to see this channel
          ...(viberRole ? [{ id: viberRole.id, deny: [PermissionFlagsBits.ViewChannel] }] : []),
        ],
      });
      chCount++;
      log.push('✓ Verification gate created');

      // ─── Step 3b: BUILD CHANNELS (locked behind Viber role) ────────────
      for (const cat of server.categories) {
        const catPerms = [];

        if (cat.staffOnly) {
          // Staff-only: hidden from everyone except staff
          catPerms.push({ id: guild.id, deny: [PermissionFlagsBits.ViewChannel] });
          for (const r of ['Mod', 'Admin', 'Owner']) {
            if (createdRoles[r]) catPerms.push({ id: createdRoles[r].id, allow: [PermissionFlagsBits.ViewChannel] });
          }
        } else {
          // Regular categories: hidden from @everyone, visible to Viber (verified)
          catPerms.push({ id: guild.id, deny: [PermissionFlagsBits.ViewChannel] });
          if (viberRole) catPerms.push({ id: viberRole.id, allow: [PermissionFlagsBits.ViewChannel] });
          // Staff can always see
          for (const r of ['Mod', 'Admin', 'Owner']) {
            if (createdRoles[r]) catPerms.push({ id: createdRoles[r].id, allow: [PermissionFlagsBits.ViewChannel] });
          }
        }

        const isMainCategory = cat.name.includes('MAIN');

        const category = await guild.channels.create({
          name: cat.name,
          type: ChannelType.GuildCategory,
          permissionOverwrites: catPerms,
        });

        for (const ch of cat.channels) {
          const type = TYPE_MAP[ch.type] || ChannelType.GuildText;

          const chPerms = [];
          // Readonly feed channels — users can see but not send
          if (ch.readonly) {
            chPerms.push(
              { id: guild.id, deny: [PermissionFlagsBits.SendMessages] },
              { id: guild.members.me.id, allow: [PermissionFlagsBits.SendMessages] },
            );
          }

          // General chat: visible to everyone (even unverified) as the only public channel
          if (isMainCategory && ch.name.includes('general')) {
            chPerms.push(
              { id: guild.id, allow: [PermissionFlagsBits.ViewChannel] },
            );
          }

          const opts = {
            name: ch.name,
            type,
            parent: category.id,
            topic: ch.topic || undefined,
          };

          if (chPerms.length) opts.permissionOverwrites = chPerms;

          // Forum channels get default layout
          if (type === ChannelType.GuildForum) {
            opts.defaultForumLayout = ForumLayoutType.ListView;
          }

          let newCh;
          try {
            newCh = await guild.channels.create(opts);
            chCount++;
          } catch (chErr) {
            console.error(`[SETUP] Failed to create channel ${ch.name}:`, chErr.message);
            continue;
          }

          // Store key channel IDs
          if (ch.name.includes('welcome')) updateGuildSetting(guild.id, 'welcome_channel_id', newCh.id);
          if (ch.name.includes('mod-log')) updateGuildSetting(guild.id, 'log_channel_id', newCh.id);
          if (ch.name.includes('starboard')) updateGuildSetting(guild.id, 'starboard_channel_id', newCh.id);
          if (ch.name.includes('news')) updateGuildSetting(guild.id, 'news_channel_id', newCh.id);
          if (ch.name.includes('crypto')) updateGuildSetting(guild.id, 'crypto_channel_id', newCh.id);
          if (ch.name.includes('stocks')) updateGuildSetting(guild.id, 'stocks_channel_id', newCh.id);
          if (ch.name.includes('ai-drops')) updateGuildSetting(guild.id, 'ai_channel_id', newCh.id);
        }
      }
      log.push(`✓ ${chCount} channels built`);

      // ─── Step 4: AUTO-ROLE ─────────────────────────────────────────────
      if (createdRoles['Viber']) {
        updateGuildSetting(guild.id, 'autorole_id', createdRoles['Viber'].id);
        log.push('✓ Auto-role → Viber');
      }

      // ─── Step 5: POST CONTENT ──────────────────────────────────────────
      await safeReply({ embeds: [vibeEmbed('SETUP', `\`\`\`ansi\n${log.join('\n')}\n\x1b[32m> echo "content" > channels/*\x1b[0m\n\`\`\``)] });

      // Rules
      const rulesCh = guild.channels.cache.find(c => c.name.includes('rules') && c.type === ChannelType.GuildText);
      if (rulesCh) {
        await rulesCh.send({ embeds: [new EmbedBuilder()
          .setColor(colors.primary)
          .setTitle('◉ RULES')
          .setDescription([
            '```ansi', '\x1b[32m> cat /etc/rules.conf\x1b[0m', '```', '',
            '`01` Respect everyone. Zero tolerance.',
            '`02` No spam, flood, or walls of text.',
            '`03` No NSFW, hate speech, or harassment.',
            '`04` No self-promo without permission.',
            '`05` Right content → right channel.',
            '`06` Staff calls are final.',
            '`07` Keep personal info private.',
            '`08` Vibe hard or go home.',
            '', '*warn → mute → ban*',
          ].join('\n'))
          .setFooter({ text: brand.footer })
        ] });
        log.push('✓ Rules');
      }

      // Role picker
      const rolesCh = guild.channels.cache.find(c => c.name.includes('roles') && c.type === ChannelType.GuildText);
      if (rolesCh) {
        const picks = ['Neon Green', 'Cyber Cyan', 'Hot Magenta', 'Amber Glow', 'Ghost White'];
        const styles = [ButtonStyle.Success, ButtonStyle.Primary, ButtonStyle.Danger, ButtonStyle.Secondary, ButtonStyle.Secondary];
        const row = new ActionRowBuilder();
        picks.forEach((name, i) => {
          row.addComponents(new ButtonBuilder()
            .setCustomId(`role_${name.replace(/\s/g, '_')}`)
            .setLabel(name)
            .setStyle(styles[i]));
        });
        await rolesCh.send({
          embeds: [new EmbedBuilder().setColor(colors.primary).setTitle('◉ COLOR SELECT')
            .setDescription('```ansi\n\x1b[32m> color --picker\x1b[0m\n```\nTap to add. Tap again to remove.')],
          components: [row],
        });
        log.push('✓ Role picker');
      }

      // Ticket button
      const botCh = guild.channels.cache.find(c => c.name.includes('bot-cmds') && c.type === ChannelType.GuildText);
      if (botCh) {
        await botCh.send({
          embeds: [new EmbedBuilder().setColor(colors.primary).setTitle('◉ SUPPORT')
            .setDescription('```ansi\n\x1b[32m> ticket --open\x1b[0m\n```\nOpen a private ticket with staff.')],
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_create').setLabel('Open Ticket').setStyle(ButtonStyle.Primary).setEmoji('🎫')
          )],
        });
        log.push('✓ Ticket system');
      }

      // Feed channel intros
      const feedIntros = [
        { match: 'news', title: '◉ NEWS FEED', desc: 'Live headlines posted every 30 minutes.\nPowered by public RSS feeds.', color: colors.primary },
        { match: 'crypto', title: '◉ CRYPTO TRACKER', desc: 'Top coin prices posted every 30 minutes.\nData from CoinGecko.', color: colors.primary },
        { match: 'stocks', title: '◉ MARKET FEED', desc: 'Market movers & trending tickers.\nUpdated periodically.', color: colors.primary },
        { match: 'ai-drops', title: '◉ AI DROPS', desc: 'Latest AI news, model releases, and tools.\nStay ahead of the curve.', color: colors.primary },
      ];
      for (const fi of feedIntros) {
        const ch = guild.channels.cache.find(c => c.name.includes(fi.match) && c.type === ChannelType.GuildText);
        if (ch) {
          await ch.send({ embeds: [new EmbedBuilder()
            .setColor(fi.color)
            .setTitle(fi.title)
            .setDescription(`\`\`\`ansi\n\x1b[32m> feed --init ${fi.match}\x1b[0m\n\`\`\`\n${fi.desc}`)
            .setFooter({ text: `Auto-updating · ${brand.footer}` })
          ] });
        }
      }
      log.push('✓ Feed channels initialized');

      // ─── Step 7b: Post verification embed ──────────────────────────────
      if (verifyCh) {
        await verifyCh.send({
          embeds: [new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('◉ VERIFICATION')
            .setDescription([
              '```ansi',
              '\x1b[32m> verify.sh — identity check required\x1b[0m',
              '\x1b[32m> protocol: CAPTCHA + account age scan\x1b[0m',
              '```',
              '',
              'Click the button below to verify your identity.',
              'You\'ll receive a **6-character code** to enter.',
              '',
              '`▸` Account must be at least **3 days** old',
              '`▸` You get **3 attempts** before lockout',
              '`▸` Code expires after **2 minutes**',
              '',
              '*After verification, this channel disappears and the full server unlocks.*',
            ].join('\n'))
            .setFooter({ text: brand.footer })
          ],
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('verify_start')
              .setLabel('VERIFY')
              .setStyle(ButtonStyle.Success)
              .setEmoji('🔐')
          )],
        });
        log.push('✓ Verification gate posted');
      }

      // ─── Step 8: AutoMod v2 Rules ─────────────────────────────────────
      await safeReply({ embeds: [vibeEmbed('SETUP', `\`\`\`ansi\n${log.join('\n')}\n\x1b[32m> automod --configure\x1b[0m\n\`\`\``)] });

      // Delete existing automod rules to avoid duplicates
      try {
        const existingRules = await guild.autoModerationRules.fetch();
        for (const [, rule] of existingRules) {
          if (rule.name.startsWith('VIBE:')) await rule.delete();
        }
      } catch {}

      // Anti-spam rule
      try {
        await guild.autoModerationRules.create({
          name: 'VIBE: Anti-Spam',
          eventType: AutoModerationRuleEventType.MessageSend,
          triggerType: AutoModerationRuleTriggerType.Spam,
          actions: [
            { type: AutoModerationActionType.BlockMessage, metadata: { customMessage: '⚠ Spam detected. Message blocked.' } },
            { type: AutoModerationActionType.Timeout, metadata: { durationSeconds: 300 } },
          ],
          enabled: true,
        });
      } catch {}

      // Anti mass-mention rule
      try {
        await guild.autoModerationRules.create({
          name: 'VIBE: Anti-Mention-Spam',
          eventType: AutoModerationRuleEventType.MessageSend,
          triggerType: AutoModerationRuleTriggerType.MentionSpam,
          triggerMetadata: { mentionTotalLimit: 5 },
          actions: [
            { type: AutoModerationActionType.BlockMessage, metadata: { customMessage: '⚠ Too many mentions. Message blocked.' } },
            { type: AutoModerationActionType.Timeout, metadata: { durationSeconds: 600 } },
          ],
          enabled: true,
        });
      } catch {}

      // Keyword filter (slurs, NSFW terms)
      try {
        await guild.autoModerationRules.create({
          name: 'VIBE: Content Filter',
          eventType: AutoModerationRuleEventType.MessageSend,
          triggerType: AutoModerationRuleTriggerType.KeywordPreset,
          triggerMetadata: {
            presets: [1, 2, 3], // Profanity, SexualContent, Slurs
          },
          actions: [
            { type: AutoModerationActionType.BlockMessage, metadata: { customMessage: '⚠ Content blocked by auto-moderation.' } },
          ],
          enabled: true,
        });
      } catch {}

      log.push('✓ AutoMod v2 rules configured');

      // ─── Step 9: Server Onboarding ─────────────────────────────────────
      try {
        const welcomeCh = guild.channels.cache.find(c => c.name.includes('welcome'));
        const rulesCh2 = guild.channels.cache.find(c => c.name.includes('rules') && c.type === ChannelType.GuildText);
        const generalCh2 = guild.channels.cache.find(c => c.name.includes('general') && c.type === ChannelType.GuildText);

        const defaultChannels = [welcomeCh, rulesCh2, generalCh2].filter(Boolean).map(c => c.id);

        // Set system channel for welcome messages
        if (welcomeCh) {
          await guild.setSystemChannel(welcomeCh.id);
          await guild.setSystemChannelFlags(0); // Enable all system messages
        }

        log.push('✓ Onboarding configured');
      } catch (e) {
        log.push('⚠ Onboarding: ' + e.message?.slice(0, 50));
      }

      // ─── DONE ──────────────────────────────────────────────────────────
      updateGuildSetting(guild.id, 'setup_complete', 1);

      const generalCh = guild.channels.cache.find(c => c.name.includes('general') && c.type === ChannelType.GuildText);
      const target = generalCh || interaction.channel;

      await target.send({ embeds: [new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle('◉ SERVER ONLINE')
        .setDescription([
          '```ansi',
          '\x1b[32m' + log.join('\n') + '\x1b[0m',
          '```', '',
          '**All systems operational.**', '',
          '`/help` — commands',
          '`/crypto` — live prices',
          '`/news` — latest headlines',
        ].join('\n'))
        .setFooter({ text: brand.footer })
        .setTimestamp()
      ] });

      try {
        if (interaction.channel.id !== target.id) await interaction.channel.delete();
        else await safeReply({ content: '`✓ Done.`', embeds: [] });
      } catch {
        await safeReply({ content: '`✓ Done.`', embeds: [] }).catch(() => {});
      }

    } catch (err) {
      console.error('[SETUP ERROR]', err);
      await safeReply({
        embeds: [vibeEmbed('ERROR', `\`\`\`ansi\n\x1b[31m${err.message}\x1b[0m\n\`\`\`\n\n${log.map(l => `▸ ${l}`).join('\n')}`)],
      }).catch(() => {});
    }
  },
};
