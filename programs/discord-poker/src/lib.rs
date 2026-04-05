use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

use instructions::*;

declare_id!("D8Wy2hh16z76BDxu8jEyZQTcVYSeAWTgS4xyqZQzp9vT");

#[program]
pub mod discord_poker {
    use super::*;

    pub fn create_table(
        ctx: Context<CreateTable>,
        table_id: u64,
        max_players: u8,
        buy_in: u64,
        is_private: bool,
        invite_code: [u8; 8],
        rake_bps: u16,
        house_wallet: Pubkey,
    ) -> Result<()> {
        instructions::create_table::handler(
            ctx, table_id, max_players, buy_in, is_private, invite_code, rake_bps, house_wallet,
        )
    }

    pub fn join_table(ctx: Context<JoinTable>, invite_code: Option<[u8; 8]>) -> Result<()> {
        instructions::join_table::handler(ctx, invite_code)
    }

    pub fn leave_table(ctx: Context<LeaveTable>) -> Result<()> {
        instructions::leave_table::handler(ctx)
    }

    pub fn start_game(ctx: Context<StartGame>) -> Result<()> {
        instructions::start_game::handler(ctx)
    }

    pub fn place_bet(ctx: Context<PlaceBet>, action: BetAction) -> Result<()> {
        instructions::place_bet::handler(ctx, action)
    }

    pub fn advance_phase(ctx: Context<AdvancePhase>) -> Result<()> {
        instructions::advance_phase::handler(ctx)
    }

    pub fn settle(ctx: Context<Settle>) -> Result<()> {
        instructions::settle::handler(ctx)
    }
}
