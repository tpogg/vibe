async function handleButton(interaction) {
  if (!interaction.customId.startsWith('role_')) return false;

  const roleName = interaction.customId.replace('role_', '').replace(/_/g, ' ');
  const role = interaction.guild.roles.cache.find(r => r.name === roleName);

  if (!role) {
    await interaction.reply({ content: `\`⚠ Role "${roleName}" not found.\``, ephemeral: true });
    return true;
  }

  const member = interaction.guild.members.cache.get(interaction.user.id) || await interaction.guild.members.fetch(interaction.user.id);

  if (member.roles.cache.has(role.id)) {
    await member.roles.remove(role);
    await interaction.reply({ content: `\`✓ Removed: ${roleName}\``, ephemeral: true });
  } else {
    // Remove other color roles first
    const colorRoles = ['Neon Green', 'Cyber Cyan', 'Hot Magenta', 'Amber Glow', 'Red Alert', 'Ghost White'];
    const toRemove = member.roles.cache.filter(r => colorRoles.includes(r.name) && r.id !== role.id);
    if (toRemove.size > 0) {
      await member.roles.remove(toRemove);
    }
    await member.roles.add(role);
    await interaction.reply({ content: `\`✓ Added: ${roleName}\``, ephemeral: true });
  }

  return true;
}

module.exports = { handleButton };
