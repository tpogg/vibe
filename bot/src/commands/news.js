const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors, brand } = require('../config');

// Free public RSS-to-JSON proxy
const FEEDS = [
  { name: 'Tech', url: 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=5' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('news')
    .setDescription('Latest tech & world headlines'),
  cooldown: 15,

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const res = await fetch(FEEDS[0].url);
      const data = await res.json();
      const articles = (data.hits || []).slice(0, 8);

      if (!articles.length) {
        return interaction.editReply({ content: '`⚠ No news found.`' });
      }

      const lines = articles.map((a, i) => {
        const url = a.url || `https://news.ycombinator.com/item?id=${a.objectID}`;
        return `\`${String(i + 1).padStart(2, '0')}\` [${a.title}](${url})\n   ↳ \`${a.points} pts\` · \`${a.num_comments} comments\``;
      });

      const embed = new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle('◉ NEWS')
        .setDescription([
          '```ansi', '\x1b[32m> news --latest\x1b[0m', '```', '',
          ...lines,
        ].join('\n'))
        .setFooter({ text: `Hacker News · ${brand.footer}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply({ content: '`⚠ Failed to fetch news.`' });
    }
  },
};
