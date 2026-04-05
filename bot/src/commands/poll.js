const { SlashCommandBuilder, PollLayoutType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a native Discord poll')
    .addStringOption(o => o.setName('question').setDescription('The poll question').setRequired(true))
    .addStringOption(o => o.setName('options').setDescription('Comma-separated options (2-10)').setRequired(true))
    .addIntegerOption(o => o.setName('hours').setDescription('Duration in hours (default: 24)').setMinValue(1).setMaxValue(168)),
  cooldown: 10,

  async execute(interaction) {
    const question = interaction.options.getString('question');
    const optionsRaw = interaction.options.getString('options');
    const hours = interaction.options.getInteger('hours') || 24;

    const answers = optionsRaw.split(',').map(o => o.trim()).filter(Boolean).slice(0, 10);
    if (answers.length < 2) {
      return interaction.reply({ content: '`⚠ Need at least 2 options, separated by commas.`', ephemeral: true });
    }

    await interaction.reply({
      poll: {
        question: { text: question },
        answers: answers.map(text => ({ text })),
        duration: hours,
        allowMultiselect: false,
        layoutType: PollLayoutType.Default,
      },
    });
  },
};
