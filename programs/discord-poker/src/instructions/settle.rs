use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::PokerError;
use crate::utils::hand_eval::{evaluate_hand, HandScore};

#[derive(Accounts)]
pub struct Settle<'info> {
    #[account(mut)]
    pub game_table: Account<'info, GameTable>,

    /// CHECK: House wallet receives rake
    #[account(mut)]
    pub house_wallet: AccountInfo<'info>,

    pub caller: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Settle>) -> Result<()> {
    let table = &mut ctx.accounts.game_table;

    require!(table.game_phase == GamePhase::Showdown, PokerError::InvalidPhase);
    require!(ctx.accounts.house_wallet.key() == table.house_wallet, PokerError::InvalidPhase);

    let pot = table.pot;

    // Calculate rake (1-2% based on rake_bps)
    let rake = pot
        .checked_mul(table.rake_bps as u64)
        .ok_or(PokerError::Overflow)?
        .checked_div(10000)
        .ok_or(PokerError::Overflow)?;
    let prize_pool = pot.checked_sub(rake).ok_or(PokerError::Overflow)?;

    // Find active (non-folded) players
    let active_players: Vec<(usize, &PlayerState)> = table.players
        .iter()
        .enumerate()
        .filter(|(_, p)| p.is_active && !p.is_folded)
        .collect();

    let winner_indices: Vec<usize>;

    if active_players.len() == 1 {
        // Everyone else folded — last player standing wins
        winner_indices = vec![active_players[0].0];
        msg!("Player {} wins by default (all others folded)!", table.players[winner_indices[0]].pubkey);
    } else {
        // Evaluate hands
        let mut hand_scores: Vec<(usize, HandScore)> = Vec::new();

        for (idx, player) in &active_players {
            let mut cards = Vec::with_capacity(7);
            cards.push(player.hole_cards[0]);
            cards.push(player.hole_cards[1]);
            for &cc in table.community_cards.iter() {
                if cc != 255 {
                    cards.push(cc);
                }
            }
            let score = evaluate_hand(&cards);
            hand_scores.push((*idx, score));
        }

        let best = hand_scores.iter().map(|(_, s)| s).max().unwrap().clone();
        winner_indices = hand_scores
            .iter()
            .filter(|(_, s)| *s == best)
            .map(|(idx, _)| *idx)
            .collect();

        msg!("Winner(s): {:?} with {:?}", winner_indices, best.rank);
    }

    // Distribute prize pool among winners (split pot if tie)
    let share = prize_pool / winner_indices.len() as u64;
    let remainder = prize_pool % winner_indices.len() as u64;

    for (i, &winner_idx) in winner_indices.iter().enumerate() {
        let bonus = if i == 0 { remainder } else { 0 };
        table.players[winner_idx].chips += share + bonus;
    }

    // Transfer rake to house wallet
    if rake > 0 {
        **table.to_account_info().try_borrow_mut_lamports()? -= rake;
        **ctx.accounts.house_wallet.try_borrow_mut_lamports()? += rake;
    }

    // Reset for next round
    table.pot = 0;
    table.current_bet = 0;
    table.game_phase = GamePhase::Waiting;
    table.dealer_pos = (table.dealer_pos + 1) % table.players.len() as u8;

    // Remove busted players (0 chips)
    table.players.retain(|p| p.chips > 0);

    // Reset player states
    for player in table.players.iter_mut() {
        player.hole_cards = [255; 2];
        player.current_bet = 0;
        player.is_folded = false;
        player.is_all_in = false;
    }

    table.last_action_ts = Clock::get()?.unix_timestamp;

    msg!("Round settled! Pot: {} | Rake: {} | Prize: {} | Winners: {}",
        pot, rake, prize_pool, winner_indices.len());

    Ok(())
}
