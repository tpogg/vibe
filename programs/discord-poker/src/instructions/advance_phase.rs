use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::PokerError;

#[derive(Accounts)]
pub struct AdvancePhase<'info> {
    #[account(mut)]
    pub game_table: Account<'info, GameTable>,

    pub caller: Signer<'info>,
}

pub fn handler(ctx: Context<AdvancePhase>) -> Result<()> {
    let table = &mut ctx.accounts.game_table;

    require!(
        matches!(table.game_phase, GamePhase::PreFlop | GamePhase::Flop | GamePhase::Turn | GamePhase::River),
        PokerError::InvalidPhase
    );

    // Only advance if betting round is complete
    require!(table.is_betting_round_complete(), PokerError::InvalidPhase);

    match table.game_phase {
        GamePhase::PreFlop => {
            // Deal flop (3 community cards)
            // Burn one card, deal three
            table.deck_index += 1; // burn
            table.community_cards[0] = table.deck[table.deck_index as usize];
            table.deck_index += 1;
            table.community_cards[1] = table.deck[table.deck_index as usize];
            table.deck_index += 1;
            table.community_cards[2] = table.deck[table.deck_index as usize];
            table.deck_index += 1;
            table.game_phase = GamePhase::Flop;
            msg!("Flop dealt: [{}, {}, {}]",
                table.community_cards[0], table.community_cards[1], table.community_cards[2]);
        }
        GamePhase::Flop => {
            // Deal turn (1 community card)
            table.deck_index += 1; // burn
            table.community_cards[3] = table.deck[table.deck_index as usize];
            table.deck_index += 1;
            table.game_phase = GamePhase::Turn;
            msg!("Turn dealt: [{}]", table.community_cards[3]);
        }
        GamePhase::Turn => {
            // Deal river (1 community card)
            table.deck_index += 1; // burn
            table.community_cards[4] = table.deck[table.deck_index as usize];
            table.deck_index += 1;
            table.game_phase = GamePhase::River;
            msg!("River dealt: [{}]", table.community_cards[4]);
        }
        GamePhase::River => {
            table.game_phase = GamePhase::Showdown;
            msg!("Moving to showdown!");
        }
        _ => return Err(PokerError::InvalidPhase.into()),
    }

    // Reset current bets for new betting round
    for player in table.players.iter_mut() {
        player.current_bet = 0;
    }
    table.current_bet = 0;

    // Set first to act (first active player after dealer)
    if let Some(next) = table.next_active_player(table.dealer_pos) {
        table.current_player = next;
    }

    table.last_action_ts = Clock::get()?.unix_timestamp;

    Ok(())
}
