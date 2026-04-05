use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::PokerError;

#[derive(Accounts)]
#[instruction(table_id: u64)]
pub struct CreateTable<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + GameTable::MAX_SIZE,
        seeds = [b"table", creator.key().as_ref(), &table_id.to_le_bytes()],
        bump,
    )]
    pub game_table: Account<'info, GameTable>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateTable>,
    table_id: u64,
    max_players: u8,
    buy_in: u64,
    is_private: bool,
    invite_code: [u8; 8],
    rake_bps: u16,
    house_wallet: Pubkey,
) -> Result<()> {
    require!(max_players >= 2 && max_players <= 9, PokerError::InvalidMaxPlayers);
    require!(rake_bps <= 200, PokerError::InvalidRake);

    let table = &mut ctx.accounts.game_table;
    table.table_id = table_id;
    table.creator = ctx.accounts.creator.key();
    table.max_players = max_players;
    table.buy_in = buy_in;
    table.is_private = is_private;
    table.invite_code = invite_code;
    table.players = Vec::new();
    table.community_cards = [255; 5]; // 255 = unrevealed
    table.deck = [0; 52];
    table.deck_index = 0;
    table.pot = 0;
    table.current_bet = 0;
    table.dealer_pos = 0;
    table.current_player = 0;
    table.game_phase = GamePhase::Waiting;
    table.round_number = 0;
    table.rake_bps = rake_bps;
    table.house_wallet = house_wallet;
    table.last_action_ts = Clock::get()?.unix_timestamp;
    table.bump = ctx.bumps.game_table;

    // Creator auto-joins
    let player = PlayerState {
        pubkey: ctx.accounts.creator.key(),
        seat: 0,
        chips: buy_in,
        hole_cards: [255; 2],
        current_bet: 0,
        is_folded: false,
        is_all_in: false,
        is_active: true,
    };
    table.players.push(player);

    // Transfer buy-in SOL to the table PDA
    let ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.creator.key(),
        &table.key(),
        buy_in,
    );
    anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.creator.to_account_info(),
            table.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    msg!("Table {} created by {} | Buy-in: {} lamports | Max: {} players",
        table_id, ctx.accounts.creator.key(), buy_in, max_players);

    Ok(())
}
