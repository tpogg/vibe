use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default, Debug)]
pub struct PlayerState {
    pub pubkey: Pubkey,
    pub seat: u8,
    pub chips: u64,
    pub hole_cards: [u8; 2],
    pub current_bet: u64,
    pub is_folded: bool,
    pub is_all_in: bool,
    pub is_active: bool,
}

impl PlayerState {
    // 32 + 1 + 8 + 2 + 8 + 1 + 1 + 1 = 54 bytes
    pub const SIZE: usize = 32 + 1 + 8 + 2 + 8 + 1 + 1 + 1;
}
