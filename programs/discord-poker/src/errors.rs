use anchor_lang::prelude::*;

#[error_code]
pub enum PokerError {
    #[msg("Table is full")]
    TableFull,
    #[msg("Player already at this table")]
    AlreadyJoined,
    #[msg("Player not found at this table")]
    PlayerNotFound,
    #[msg("Invalid game phase for this action")]
    InvalidPhase,
    #[msg("Not your turn")]
    NotYourTurn,
    #[msg("Insufficient chips")]
    InsufficientChips,
    #[msg("Invalid bet amount")]
    InvalidBetAmount,
    #[msg("Invalid raise amount - must be at least double current bet")]
    InvalidRaise,
    #[msg("Need at least 2 players to start")]
    NotEnoughPlayers,
    #[msg("Invalid invite code for private table")]
    InvalidInviteCode,
    #[msg("Max players must be between 2 and 9")]
    InvalidMaxPlayers,
    #[msg("Cannot leave during an active hand")]
    CannotLeaveDuringHand,
    #[msg("Invalid rake basis points (max 200 = 2%)")]
    InvalidRake,
    #[msg("Only the creator can start the game")]
    NotCreator,
    #[msg("Arithmetic overflow")]
    Overflow,
}
