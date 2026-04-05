const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors, brand } = require('../config');

const FORTUNES = [
  'The best code is the code you never have to write.',
  'It works on my machine. Ship the machine.',
  'Debugging is being a detective in a crime movie where you are also the murderer.',
  'The first 90% takes 90% of the time. The last 10% takes the other 90%.',
  'There are 2 hard problems in CS: caching, naming things, and off-by-one errors.',
  'The cloud is just someone else\'s computer — and it\'s on fire.',
  '"Works for me" is not a valid deployment strategy.',
  'Ship fast, but not so fast you forget to test.',
  'Every system eventually becomes a distributed system.',
  'The future belongs to those who vibe with it.',
  'Your potential is loading... please wait.',
  'Great things come to those who don\'t rage-quit.',
  'Today\'s bug is tomorrow\'s feature.',
  'The algorithm favors the bold.',
  'You are one commit away from greatness.',
  'Trust the process. Also, trust the compiler.',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fortune')
    .setDescription('Receive wisdom from the terminal'),
  cooldown: 10,

  async execute(interaction) {
    const fortune = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];

    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle('◉ FORTUNE')
      .setDescription([
        '```ansi',
        `\x1b[32m> fortune --wisdom\x1b[0m`,
        '```',
        '',
        `*"${fortune}"*`,
      ].join('\n'))
      .setFooter({ text: brand.footer })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
