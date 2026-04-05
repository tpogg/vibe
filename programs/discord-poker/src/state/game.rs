use anchor_lang::prelude::*;
use super::player::PlayerState;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum GamePhase {
    Waiting,
    PreFlop,
    Flop,
    Turn,
    River,
    Showdown,
}

impl Default for GamePhase {
    fn default() -> Self {
        GamePhase::Waiting
    }
}

#[account]
#[derive(Debug)]
pub struct GameTable {
    pub table_id: u64,
    pub creator: Pubkey,
    pub max_players: u8,
    pub buy_in: u64,
    pub is_private: bool,
    pub invite_code: [u8; 8],
    pub players: Vec<PlayerState>,
    pub community_cards: [u8; 5],
    pub deck: [u8; 52],
    pub deck_index: u8,
    pub pot: u64,
    pub current_bet: u64,
    pub dealer_pos: u8,
    pub current_player: u8,
    pub game_phase: GamePhase,
    pub round_number: u64,
    pub rake_bps: u16,
    pub house_wallet: Pubkey,
    pub last_action_ts: i64,
    pub bump: u8,
}

impl GameTable {
    // 8 discriminator + fields
    // 8 + 32 + 1 + 8 + 1 + 8 + 4+(54*9) + 5 + 52 + 1 + 8 + 8 + 1 + 1 + 1 + 8 + 2 + 32 + 8 + 1
    // = 8 + 32 + 1 + 8 + 1 + 8 + 490 + 5 + 52 + 1 + 8 + 8 + 1 + 1 + 1 + 8 + 2 + 32 + 8 + 1
    // = 668 + bump for vec overhead
    pub const MAX_SIZE: usize = 8 + 32 + 1 + 8 + 1 + 8 + (4 + 54 * 9) + 5 + 52 + 1 + 8 + 8 + 1 + 1 + 1 + 8 + 2 + 32 + 8 + 1;

    pub fn active_player_count(&self) -> usize {
        self.players.iter().filter(|p| p.is_active && !p.is_folded).count()
    }

    pub fn next_active_player(&self, from: u8) -> Option<u8> {
        let count = self.players.len() as u8;
        if count == 0 {
            return None;
        }
        let mut pos = (from + 1) % count;
        for _ in 0..count {
            if let Some(p) = self.players.get(pos as usize) {
                if p.is_active && !p.is_folded && !p.is_all_in {
                    return Some(pos);
                }
            }
            pos = (pos + 1) % count;
        }
        None
    }

    pub fn is_betting_round_complete(&self) -> bool {
        let active_players: Vec<&PlayerState> = self.players
            .iter()
            .filter(|p| p.is_active && !p.is_folded && !p.is_all_in)
            .collect();

        if active_players.is_empty() {
            return true;
        }

        active_players.iter().all(|p| p.current_bet == self.current_bet)
    }
}

impl Default for GameTable {
    fn default() -> Self {
        Self {
            table_id: 0,
            creator: Pubkey::default(),
            max_players: 2,
            buy_in: 0,
            is_private: false,
            invite_code: [0; 8],
            players: Vec::new(),
            community_cards: [0; 5],
            deck: [0; 52],
            deck_index: 0,
            pot: 0,
            current_bet: 0,
            dealer_pos: 0,
            current_player: 0,
            game_phase: GamePhase::default(),
            round_number: 0,
            rake_bps: 0,
            house_wallet: Pubkey::default(),
            last_action_ts: 0,
            bump: 0,
        }
    }
}
