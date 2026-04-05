const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors, brand } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands'),
  cooldown: 5,

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle('VIBE TERMINAL — Command List')
      .setDescription([
        '```ansi',
        '\x1b[32m> HELP.exe loaded\x1b[0m',
        '\x1b[32m> All systems operational\x1b[0m',
        '```',
      ].join('\n'))
      .addFields(
        {
          name: `${brand.emoji.gear}  Utility`,
          value: [
            '`/help` — This menu',
            '`/ping` — Bot latency',
            '`/serverinfo` — Server statistics',
            '`/userinfo` — User details',
            '`/avatar` — Get someone\'s avatar',
          ].join('\n'),
          inline: true,
        },
        {
          name: `${brand.emoji.bolt}  Fun`,
          value: [
            '`/vibecheck` — Check your vibe level',
            '`/8ball` — Ask the oracle',
            '`/fortune` — Random wisdom',
            '`/coinflip` — Flip a coin',
            '`/roll` — Roll dice',
          ].join('\n'),
          inline: true,
        },
        {
          name: `${brand.emoji.shield}  Moderation`,
          value: [
            '`/kick` — Kick a member',
            '`/ban` — Ban a member',
            '`/timeout` — Timeout a member',
            '`/warn` — Warn a member',
            '`/warnings` — View warnings',
            '`/purge` — Bulk delete messages',
          ].join('\n'),
          inline: true,
        },
        {
          name: `📡  Feeds`,
          value: [
            '`/crypto` — Live crypto prices',
            '`/news` — Tech headlines',
            '`/stocks` — Trending tickers',
            '`/ai` — AI news & drops',
          ].join('\n'),
          inline: true,
        },
        {
          name: `${brand.emoji.star}  Engagement`,
          value: [
            '`/level` — Check your level & XP',
            '`/leaderboard` — Server XP rankings',
            '`/ticket` — Open a support ticket',
          ].join('\n'),
          inline: true,
        },
        {
          name: `${brand.emoji.crown}  Admin`,
          value: [
            '`/setup` — Auto-configure the server',
            '`/announce` — Post an announcement',
          ].join('\n'),
          inline: true,
        },
      )
      .setFooter({ text: brand.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
