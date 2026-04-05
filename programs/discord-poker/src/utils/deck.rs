/// Card encoding: 0-51
/// suit = card / 13 (0=Hearts, 1=Diamonds, 2=Clubs, 3=Spades)
/// rank = card % 13 (0=2, 1=3, ..., 8=10, 9=J, 10=Q, 11=K, 12=A)

/// Create and shuffle a deck using a seed (from VRF or blockhash).
/// Uses Fisher-Yates shuffle with seed bytes as entropy.
pub fn shuffle_deck(seed: &[u8]) -> [u8; 52] {
    let mut deck = [0u8; 52];
    for i in 0..52u8 {
        deck[i as usize] = i;
    }

    // Fisher-Yates shuffle using seed bytes
    let mut seed_idx = 0;
    for i in (1..52).rev() {
        // Use two seed bytes to generate an index
        let b1 = seed[seed_idx % seed.len()] as u32;
        let b2 = seed[(seed_idx + 1) % seed.len()] as u32;
        seed_idx += 2;
        let rand_val = (b1 << 8) | b2;
        let j = (rand_val % (i as u32 + 1)) as usize;
        deck.swap(i as usize, j);
    }

    deck
}

pub fn card_rank(card: u8) -> u8 {
    card % 13
}

pub fn card_suit(card: u8) -> u8 {
    card / 13
}

pub fn card_name(card: u8) -> (&'static str, &'static str) {
    let ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    let suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
    (ranks[card_rank(card) as usize], suits[card_suit(card) as usize])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_shuffle_produces_valid_deck() {
        let seed = [42u8; 64];
        let deck = shuffle_deck(&seed);

        // All 52 cards present
        let mut found = [false; 52];
        for &card in deck.iter() {
            assert!(card < 52);
            assert!(!found[card as usize], "Duplicate card found");
            found[card as usize] = true;
        }
        assert!(found.iter().all(|&f| f));
    }

    #[test]
    fn test_different_seeds_different_decks() {
        let deck1 = shuffle_deck(&[1u8; 64]);
        let deck2 = shuffle_deck(&[2u8; 64]);
        assert_ne!(deck1, deck2);
    }
}
