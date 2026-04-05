import { SlashCommandBuilder } from "discord.js";

// TODO: Implement balance check
export const data = new SlashCommandBuilder()
  .setName("balance")
  .setDescription("Check SOL balance")
  .addStringOption((opt) =>
    opt.setName("wallet").setDescription("Wallet address (optional)").setRequired(false)
  );

export async function execute(interaction: any) {
  const wallet = interaction.options.getString("wallet");
  // TODO: Query Solana RPC for balance
  await interaction.reply({
    content: `Checking balance${wallet ? ` for ${wallet}` : ""}... (not yet implemented)`,
    ephemeral: true,
  });
}
