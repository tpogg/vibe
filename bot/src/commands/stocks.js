const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors, brand } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stocks')
    .setDescription('Trending market tickers'),
  cooldown: 15,

  async execute(interaction) {
    await interaction.deferReply();

    try {
      // Use CoinGecko trending as a proxy for "market movers" (free, no key)
      const res = await fetch('https://api.coingecko.com/api/v3/search/trending');
      const data = await res.json();
      const coins = (data.coins || []).slice(0, 8);

      if (!coins.length) {
        return interaction.editReply({ content: '`⚠ No trending data.`' });
      }

      const lines = coins.map((c, i) => {
        const item = c.item;
        const price = item.data?.price ? `$${parseFloat(item.data.price).toFixed(4)}` : 'N/A';
        const change = item.data?.price_change_percentage_24h?.usd?.toFixed(2) || '0.00';
        const arrow = change >= 0 ? '▲' : '▼';
        return `\`${String(i + 1).padStart(2, '0')}\` **${item.symbol}** — ${item.name}\n   \`${price}\` ${arrow} \`${change}%\` · Rank #${item.market_cap_rank || '?'}`;
      });

      const embed = new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle('📈 TRENDING')
        .setDescription([
          '```ansi', '\x1b[32m> market --trending\x1b[0m', '```', '',
          ...lines,
        ].join('\n'))
        .setFooter({ text: `CoinGecko Trending · ${brand.footer}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply({ content: '`⚠ Failed to fetch market data.`' });
    }
  },
};
