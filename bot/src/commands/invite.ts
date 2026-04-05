import { SlashCommandBuilder } from "discord.js";

// TODO: Implement invite link generation
export const data = new SlashCommandBuilder()
  .setName("invite")
  .setDescription("Generate a private table invite link");

export async function execute(interaction: any) {
  // TODO: Generate invite code, create table link embed
  await interaction.reply({
    content: "Generating invite... (not yet implemented)",
    ephemeral: true,
  });
}
