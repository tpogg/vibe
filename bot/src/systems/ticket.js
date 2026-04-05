const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { colors, brand } = require('../config');
const { createTicket, closeTicket, getOpenTickets, getGuildSettings } = require('../utils/database');

async function handleButton(interaction) {
  if (interaction.customId === 'ticket_create') {
    // Show modal for ticket reason
    const modal = new ModalBuilder()
      .setCustomId('ticket_modal')
      .setTitle('Open a Support Ticket');

    const reasonInput = new TextInputBuilder()
      .setCustomId('ticket_reason')
      .setLabel('What do you need help with?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Describe your issue...')
      .setMaxLength(500)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
    await interaction.showModal(modal);
    return true;
  }

  if (interaction.customId === 'ticket_close') {
    await closeTicketChannel(interaction);
    return true;
  }

  return false;
}

async function handleModal(interaction) {
  if (interaction.customId !== 'ticket_modal') return;

  const reason = interaction.fields.getTextInputValue('ticket_reason');
  await createTicketChannel(interaction, reason);
}

async function createTicket(interaction) {
  // Quick create without modal
  await createTicketChannel(interaction, 'No reason specified');
}

async function createTicketChannel(interaction, reason) {
  const guild = interaction.guild;
  const user = interaction.user;

  // Check for existing open tickets
  const open = getOpenTickets(guild.id, user.id);
  if (open.length >= 2) {
    return interaction.reply({
      content: '`⚠ You already have 2 open tickets. Please close one first.`',
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  // Find or create ticket category
  let category = guild.channels.cache.find(
    c => c.name.includes('STAFF') && c.type === ChannelType.GuildCategory
  );

  const modRole = guild.roles.cache.find(r => r.name === 'Mod' || r.name === 'Moderator');

  const permOverwrites = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    { id: guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
  ];
  if (modRole) {
    permOverwrites.push({ id: modRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
  }

  const ticketNum = Math.floor(Math.random() * 9000) + 1000;
  const channel = await guild.channels.create({
    name: `ticket-${ticketNum}`,
    type: ChannelType.GuildText,
    parent: category?.id,
    topic: `Ticket by ${user.username} — ${reason}`,
    permissionOverwrites: permOverwrites,
  });

  createTicketDb(guild.id, channel.id, user.id);

  const embed = new EmbedBuilder()
    .setColor(colors.primary)
    .setTitle(`◉ TICKET #${ticketNum}`)
    .setDescription([
      '```ansi',
      '\x1b[32m> ticket --open\x1b[0m',
      '```',
      '',
      `**Opened by:** ${user}`,
      `**Reason:** ${reason}`,
      '',
      'A staff member will be with you shortly.',
    ].join('\n'))
    .setFooter({ text: brand.footer })
    .setTimestamp();

  const closeBtn = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒')
  );

  await channel.send({ embeds: [embed], components: [closeBtn] });
  await interaction.editReply({ content: `\`✓ Ticket created:\` ${channel}` });
}

async function closeTicketChannel(interaction) {
  const channel = interaction.channel;

  const embed = new EmbedBuilder()
    .setColor(colors.primary)
    .setTitle('◉ TICKET CLOSED')
    .setDescription([
      '```ansi',
      '\x1b[32m> ticket --close\x1b[0m',
      '```',
      `Closed by ${interaction.user}. This channel will be deleted in 10 seconds.`,
    ].join('\n'))
    .setFooter({ text: brand.footer })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
  closeTicket(channel.id);

  setTimeout(async () => {
    try { await channel.delete(); } catch {}
  }, 10_000);
}

// Rename to avoid collision
function createTicketDb(guildId, channelId, userId) {
  const { createTicket: dbCreate } = require('../utils/database');
  dbCreate(guildId, channelId, userId);
}

module.exports = { handleButton, handleModal, createTicket };
