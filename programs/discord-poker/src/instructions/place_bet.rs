use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::PokerError;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum BetAction {
    Fold,
    Check,
    Call,
    Raise { amount: u64 },
    AllIn,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub game_table: Account<'info, GameTable>,

    pub player: Signer<'info>,
}

pub fn handler(ctx: Context<PlaceBet>, action: BetAction) -> Result<()> {
    let table = &mut ctx.accounts.game_table;
    let player_key = ctx.accounts.player.key();

    require!(
        matches!(table.game_phase, GamePhase::PreFlop | GamePhase::Flop | GamePhase::Turn | GamePhase::River),
        PokerError::InvalidPhase
    );

    let player_idx = table.players
        .iter()
        .position(|p| p.pubkey == player_key)
        .ok_or(PokerError::PlayerNotFound)?;

    require!(table.current_player == player_idx as u8, PokerError::NotYourTurn);
    require!(!table.players[player_idx].is_folded, PokerError::InvalidPhase);

    let current_bet = table.current_bet;

    match action {
        BetAction::Fold => {
            table.players[player_idx].is_folded = true;
            msg!("Player {} folds", player_key);
        }
        BetAction::Check => {
            require!(
                table.players[player_idx].current_bet >= current_bet,
                PokerError::InvalidBetAmount
            );
            msg!("Player {} checks", player_key);
        }
        BetAction::Call => {
            let call_amount = current_bet
                .checked_sub(table.players[player_idx].current_bet)
                .ok_or(PokerError::Overflow)?;
            let actual_call = call_amount.min(table.players[player_idx].chips);

            table.players[player_idx].chips -= actual_call;
            table.players[player_idx].current_bet += actual_call;
            table.pot += actual_call;

            if table.players[player_idx].chips == 0 {
                table.players[player_idx].is_all_in = true;
            }

            msg!("Player {} calls {} lamports", player_key, actual_call);
        }
        BetAction::Raise { amount } => {
            let min_raise = current_bet * 2;
            require!(amount >= min_raise || amount == table.players[player_idx].chips + table.players[player_idx].current_bet,
                PokerError::InvalidRaise);

            let raise_cost = amount
                .checked_sub(table.players[player_idx].current_bet)
                .ok_or(PokerError::Overflow)?;
            require!(raise_cost <= table.players[player_idx].chips, PokerError::InsufficientChips);

            table.players[player_idx].chips -= raise_cost;
            table.players[player_idx].current_bet = amount;
            table.pot += raise_cost;
            table.current_bet = amount;

            if table.players[player_idx].chips == 0 {
                table.players[player_idx].is_all_in = true;
            }

            msg!("Player {} raises to {} lamports", player_key, amount);
        }
        BetAction::AllIn => {
            let all_in_amount = table.players[player_idx].chips;
            table.players[player_idx].current_bet += all_in_amount;
            table.pot += all_in_amount;
            table.players[player_idx].chips = 0;
            table.players[player_idx].is_all_in = true;

            if table.players[player_idx].current_bet > current_bet {
                table.current_bet = table.players[player_idx].current_bet;
            }

            msg!("Player {} goes ALL IN for {} lamports!", player_key, all_in_amount);
        }
    }

    // Check if only one player remains (everyone else folded)
    let active_count = table.active_player_count();
    if active_count <= 1 {
        table.game_phase = GamePhase::Showdown;
        msg!("All but one player folded - moving to showdown");
    } else {
        // Advance to next active player
        let num_players = table.players.len() as u8;
        let mut next = (table.current_player + 1) % num_players;
        let mut checked = 0;
        while checked < num_players {
            if let Some(p) = table.players.get(next as usize) {
                if p.is_active && !p.is_folded && !p.is_all_in {
                    break;
                }
            }
            next = (next + 1) % num_players;
            checked += 1;
        }
        table.current_player = next;
    }

    table.last_action_ts = Clock::get()?.unix_timestamp;

    Ok(())
}
