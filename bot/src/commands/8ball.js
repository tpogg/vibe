const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors, brand } = require('../config');

const ANSWERS = [
  { text: 'It is certain.', type: 'positive' },
  { text: 'Without a doubt.', type: 'positive' },
  { text: 'The grid says yes.', type: 'positive' },
  { text: 'Absolutely.', type: 'positive' },
  { text: 'Signs point to yes.', type: 'positive' },
  { text: 'The simulation confirms it.', type: 'positive' },
  { text: 'Ask again later.', type: 'neutral' },
  { text: 'Cannot compute right now.', type: 'neutral' },
  { text: 'The matrix is buffering...', type: 'neutral' },
  { text: 'Signal unclear. Try again.', type: 'neutral' },
  { text: 'Don\'t count on it.', type: 'negative' },
  { text: 'The grid says no.', type: 'negative' },
  { text: 'Very doubtful.', type: 'negative' },
  { text: 'Outlook: grim.', type: 'negative' },
  { text: 'ERROR 404: Positive outcome not found.', type: 'negative' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the oracle a question')
    .addStringOption(o => o.setName('question').setDescription('Your question').setRequired(true)),
  cooldown: 5,

  async execute(interaction) {
    const question = interaction.options.getString('question');
    const answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle('◉ ORACLE')
      .setDescription([
        '```ansi',
        `\x1b[32m> oracle --ask "${question}"\x1b[0m`,
        '```',
        '',
        `**${answer.text}**`,
      ].join('\n'))
      .setFooter({ text: brand.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
