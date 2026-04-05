use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::PokerError;
use crate::utils::deck::shuffle_deck;

#[derive(Accounts)]
pub struct StartGame<'info> {
    #[account(mut)]
    pub game_table: Account<'info, GameTable>,

    #[account(mut)]
    pub creator: Signer<'info>,

    /// Slot hashes sysvar for randomness seed
    /// CHECK: We just read the account data for entropy
    #[account(address = anchor_lang::solana_program::sysvar::slot_hashes::id())]
    pub slot_hashes: AccountInfo<'info>,
}

pub fn handler(ctx: Context<StartGame>) -> Result<()> {
    let table = &mut ctx.accounts.game_table;

    require!(table.game_phase == GamePhase::Waiting, PokerError::InvalidPhase);
    require!(ctx.accounts.creator.key() == table.creator, PokerError::NotCreator);
    require!(table.players.len() >= 2, PokerError::NotEnoughPlayers);

    // Generate randomness from slot hashes + table state
    // In production, replace with ORAO VRF CPI for provably fair randomness
    let slot_hashes_data = ctx.accounts.slot_hashes.try_borrow_data()?;
    let clock = Clock::get()?;

    let mut seed = [0u8; 64];
    // Mix slot hash data with table-specific entropy
    let hash_slice = &slot_hashes_data[8..40.min(slot_hashes_data.len())];
    for (i, &b) in hash_slice.iter().enumerate() {
        seed[i % 64] ^= b;
    }
    // Mix in clock for additional entropy
    let ts_bytes = clock.unix_timestamp.to_le_bytes();
    let slot_bytes = clock.slot.to_le_bytes();
    for (i, &b) in ts_bytes.iter().chain(slot_bytes.iter()).enumerate() {
        seed[(32 + i) % 64] ^= b;
    }
    // Mix in table state
    let table_bytes = table.table_id.to_le_bytes();
    let round_bytes = table.round_number.to_le_bytes();
    for (i, &b) in table_bytes.iter().chain(round_bytes.iter()).enumerate() {
        seed[(48 + i) % 64] ^= b;
    }

    // Shuffle deck
    table.deck = shuffle_deck(&seed);
    table.deck_index = 0;
    table.community_cards = [255; 5];
    table.round_number += 1;
    table.pot = 0;
    table.current_bet = 0;

    // Reset player states for new round
    for player in table.players.iter_mut() {
        player.hole_cards = [255; 2];
        player.current_bet = 0;
        player.is_folded = false;
        player.is_all_in = false;
    }

    // Deal hole cards (2 per player)
    let num_players = table.players.len();
    for i in 0..num_players {
        let card1 = table.deck[table.deck_index as usize];
        table.deck_index += 1;
        let card2 = table.deck[table.deck_index as usize];
        table.deck_index += 1;
        table.players[i].hole_cards = [card1, card2];
    }

    // Post blinds (small blind = buy_in / 100, big blind = 2x small)
    let small_blind = (table.buy_in / 100).max(1);
    let big_blind = small_blind * 2;

    let sb_pos = (table.dealer_pos + 1) % num_players as u8;
    let bb_pos = (table.dealer_pos + 2) % num_players as u8;

    // Post small blind
    let sb_amount = small_blind.min(table.players[sb_pos as usize].chips);
    table.players[sb_pos as usize].chips -= sb_amount;
    table.players[sb_pos as usize].current_bet = sb_amount;
    table.pot += sb_amount;

    // Post big blind
    let bb_amount = big_blind.min(table.players[bb_pos as usize].chips);
    table.players[bb_pos as usize].chips -= bb_amount;
    table.players[bb_pos as usize].current_bet = bb_amount;
    table.pot += bb_amount;

    table.current_bet = big_blind;
    table.game_phase = GamePhase::PreFlop;

    // First to act is UTG (after big blind)
    table.current_player = (bb_pos + 1) % num_players as u8;
    table.last_action_ts = clock.unix_timestamp;

    msg!("Round {} started! {} players | Blinds: {}/{} | Dealing cards...",
        table.round_number, num_players, small_blind, big_blind);

    Ok(())
}
