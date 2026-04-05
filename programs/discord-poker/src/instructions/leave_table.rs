use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::PokerError;

#[derive(Accounts)]
pub struct LeaveTable<'info> {
    #[account(mut)]
    pub game_table: Account<'info, GameTable>,

    #[account(mut)]
    pub player: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<LeaveTable>) -> Result<()> {
    let table = &mut ctx.accounts.game_table;
    let player_key = ctx.accounts.player.key();

    require!(table.game_phase == GamePhase::Waiting, PokerError::CannotLeaveDuringHand);

    let player_idx = table.players
        .iter()
        .position(|p| p.pubkey == player_key)
        .ok_or(PokerError::PlayerNotFound)?;

    let refund = table.players[player_idx].chips;
    table.players.remove(player_idx);

    // Refund chips via PDA transfer
    if refund > 0 {
        **table.to_account_info().try_borrow_mut_lamports()? -= refund;
        **ctx.accounts.player.to_account_info().try_borrow_mut_lamports()? += refund;
    }

    msg!("Player {} left table {} | Refunded: {} lamports",
        player_key, table.table_id, refund);

    Ok(())
}
