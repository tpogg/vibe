const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors, brand, feeds } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('crypto')
    .setDescription('Live crypto prices')
    .addStringOption(o => o.setName('coin').setDescription('Specific coin (e.g. bitcoin, ethereum)')),
  cooldown: 10,

  async execute(interaction) {
    await interaction.deferReply();

    const specific = interaction.options.getString('coin');
    const coins = specific ? [specific.toLowerCase()] : feeds.crypto.coins;

    try {
      const url = `${feeds.crypto.apiUrl}/simple/price?ids=${coins.join(',')}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;
      const res = await fetch(url);
      const data = await res.json();

      if (!Object.keys(data).length) {
        return interaction.editReply({ content: '`⚠ Coin not found.`' });
      }

      const lines = Object.entries(data).map(([coin, info]) => {
        const price = info.usd?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || 'N/A';
        const change = info.usd_24h_change?.toFixed(2) || '0.00';
        const arrow = change >= 0 ? '▲' : '▼';
        const mcap = info.usd_market_cap ? `$${(info.usd_market_cap / 1e9).toFixed(2)}B` : 'N/A';
        return `**${coin.toUpperCase()}**\n\`${price}\` ${arrow} \`${change}%\` · MCap \`${mcap}\``;
      });

      const embed = new EmbedBuilder()
        .setColor(colors.warning)
        .setTitle('₿ CRYPTO')
        .setDescription([
          '```ansi', '\x1b[33m> crypto --prices\x1b[0m', '```', '',
          ...lines,
        ].join('\n'))
        .setFooter({ text: `CoinGecko · ${brand.footer}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply({ content: '`⚠ Failed to fetch crypto data.`' });
    }
  },
};
