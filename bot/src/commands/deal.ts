import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

// TODO: Implement deal command (admin only)
export const data = new SlashCommandBuilder()
  .setName("deal")
  .setDescription("Start dealing cards (admin only)")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: any) {
  // TODO: Call startGame instruction on-chain
  await interaction.reply({
    content: "Dealing cards... (not yet implemented)",
    ephemeral: true,
  });
}
