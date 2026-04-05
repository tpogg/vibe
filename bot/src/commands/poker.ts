import { SlashCommandBuilder } from "discord.js";

// TODO: Implement poker join command
export const data = new SlashCommandBuilder()
  .setName("poker")
  .setDescription("Poker table commands")
  .addSubcommand((sub) =>
    sub
      .setName("join")
      .setDescription("Join a poker table")
      .addStringOption((opt) =>
        opt.setName("table_id").setDescription("The table ID to join").setRequired(true)
      )
  );

export async function execute(interaction: any) {
  const tableId = interaction.options.getString("table_id");
  // TODO: Look up table on-chain, post embed with join link
  await interaction.reply({
    content: `Joining table ${tableId}... (not yet implemented)`,
    ephemeral: true,
  });
}
