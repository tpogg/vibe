const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors, brand } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Latest AI news and model drops'),
  cooldown: 15,

  async execute(interaction) {
    await interaction.deferReply();

    try {
      // HN search for AI-related posts
      const res = await fetch('https://hn.algolia.com/api/v1/search?query=AI%20LLM%20GPT%20Claude&tags=story&hitsPerPage=8');
      const data = await res.json();
      const articles = (data.hits || []).slice(0, 8);

      if (!articles.length) {
        return interaction.editReply({ content: '`⚠ No AI news found.`' });
      }

      const lines = articles.map((a, i) => {
        const url = a.url || `https://news.ycombinator.com/item?id=${a.objectID}`;
        return `\`${String(i + 1).padStart(2, '0')}\` [${a.title}](${url})\n   ↳ \`${a.points} pts\` · \`${a.num_comments} comments\``;
      });

      const embed = new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle('◉ AI DROPS')
        .setDescription([
          '```ansi', '\x1b[32m> ai --latest\x1b[0m', '```', '',
          ...lines,
        ].join('\n'))
        .setFooter({ text: `Hacker News AI · ${brand.footer}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply({ content: '`⚠ Failed to fetch AI news.`' });
    }
  },
};
