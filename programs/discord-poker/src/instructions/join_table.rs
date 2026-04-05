use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::PokerError;

#[derive(Accounts)]
pub struct JoinTable<'info> {
    #[account(mut)]
    pub game_table: Account<'info, GameTable>,

    #[account(mut)]
    pub player: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<JoinTable>, invite_code: Option<[u8; 8]>) -> Result<()> {
    let table = &mut ctx.accounts.game_table;
    let player_key = ctx.accounts.player.key();

    require!(table.game_phase == GamePhase::Waiting, PokerError::InvalidPhase);
    require!(table.players.len() < table.max_players as usize, PokerError::TableFull);
    require!(
        !table.players.iter().any(|p| p.pubkey == player_key),
        PokerError::AlreadyJoined
    );

    if table.is_private {
        let code = invite_code.unwrap_or([0; 8]);
        require!(code == table.invite_code, PokerError::InvalidInviteCode);
    }

    let seat = table.players.len() as u8;
    let player_state = PlayerState {
        pubkey: player_key,
        seat,
        chips: table.buy_in,
        hole_cards: [255; 2],
        current_bet: 0,
        is_folded: false,
        is_all_in: false,
        is_active: true,
    };
    table.players.push(player_state);

    // Transfer buy-in
    let ix = anchor_lang::solana_program::system_instruction::transfer(
        &player_key,
        &table.key(),
        table.buy_in,
    );
    anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.player.to_account_info(),
            table.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    msg!("Player {} joined table {} at seat {}",
        player_key, table.table_id, seat);

    Ok(())
}
