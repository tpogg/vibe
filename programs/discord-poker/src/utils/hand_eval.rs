use super::deck::{card_rank, card_suit};

/// Hand rankings from lowest to highest
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum HandRank {
    HighCard,
    OnePair,
    TwoPair,
    ThreeOfAKind,
    Straight,
    Flush,
    FullHouse,
    FourOfAKind,
    StraightFlush,
    RoyalFlush,
}

/// A scored hand: (rank, tiebreakers) for comparison.
/// Higher is better. Tiebreakers are ordered high-to-low.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HandScore {
    pub rank: HandRank,
    pub tiebreakers: [u8; 5],
}

impl PartialOrd for HandScore {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for HandScore {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.rank.cmp(&other.rank)
            .then_with(|| self.tiebreakers.cmp(&other.tiebreakers))
    }
}

/// Evaluate the best 5-card hand from 7 cards (2 hole + 5 community).
pub fn evaluate_hand(cards: &[u8]) -> HandScore {
    assert!(cards.len() >= 5);

    let mut best = HandScore {
        rank: HandRank::HighCard,
        tiebreakers: [0; 5],
    };

    // Generate all C(n,5) combinations
    let n = cards.len();
    for i in 0..n {
        for j in (i + 1)..n {
            for k in (j + 1)..n {
                for l in (k + 1)..n {
                    for m in (l + 1)..n {
                        let combo = [cards[i], cards[j], cards[k], cards[l], cards[m]];
                        let score = score_five(&combo);
                        if score > best {
                            best = score;
                        }
                    }
                }
            }
        }
    }

    best
}

/// Score exactly 5 cards.
fn score_five(cards: &[u8; 5]) -> HandScore {
    let mut ranks: Vec<u8> = cards.iter().map(|&c| card_rank(c)).collect();
    let suits: Vec<u8> = cards.iter().map(|&c| card_suit(c)).collect();

    ranks.sort_unstable_by(|a, b| b.cmp(a)); // descending

    let is_flush = suits.iter().all(|&s| s == suits[0]);

    let is_straight = is_straight_hand(&ranks);
    let is_ace_low_straight = ranks == [12, 3, 2, 1, 0]; // A-5 straight

    // Count rank frequencies
    let mut freq = [0u8; 13];
    for &r in &ranks {
        freq[r as usize] += 1;
    }

    let mut pairs = Vec::new();
    let mut trips = Vec::new();
    let mut quads = Vec::new();
    let mut kickers = Vec::new();

    // Process from highest rank to lowest
    for r in (0..13u8).rev() {
        match freq[r as usize] {
            4 => quads.push(r),
            3 => trips.push(r),
            2 => pairs.push(r),
            1 => kickers.push(r),
            _ => {}
        }
    }

    if is_flush && is_straight {
        if ranks[0] == 12 && ranks[1] == 11 { // A-K high
            return HandScore { rank: HandRank::RoyalFlush, tiebreakers: [12, 0, 0, 0, 0] };
        }
        let high = if is_ace_low_straight { 3 } else { ranks[0] };
        return HandScore { rank: HandRank::StraightFlush, tiebreakers: [high, 0, 0, 0, 0] };
    }

    if !quads.is_empty() {
        let q = quads[0];
        let k = ranks.iter().find(|&&r| r != q).copied().unwrap_or(0);
        return HandScore { rank: HandRank::FourOfAKind, tiebreakers: [q, k, 0, 0, 0] };
    }

    if !trips.is_empty() && !pairs.is_empty() {
        return HandScore {
            rank: HandRank::FullHouse,
            tiebreakers: [trips[0], pairs[0], 0, 0, 0],
        };
    }

    if is_flush {
        return HandScore {
            rank: HandRank::Flush,
            tiebreakers: [ranks[0], ranks[1], ranks[2], ranks[3], ranks[4]],
        };
    }

    if is_straight {
        let high = if is_ace_low_straight { 3 } else { ranks[0] };
        return HandScore { rank: HandRank::Straight, tiebreakers: [high, 0, 0, 0, 0] };
    }

    if !trips.is_empty() {
        return HandScore {
            rank: HandRank::ThreeOfAKind,
            tiebreakers: [trips[0], kickers.first().copied().unwrap_or(0), kickers.get(1).copied().unwrap_or(0), 0, 0],
        };
    }

    if pairs.len() >= 2 {
        let k = kickers.first().copied().unwrap_or(0);
        return HandScore {
            rank: HandRank::TwoPair,
            tiebreakers: [pairs[0], pairs[1], k, 0, 0],
        };
    }

    if pairs.len() == 1 {
        return HandScore {
            rank: HandRank::OnePair,
            tiebreakers: [
                pairs[0],
                kickers.first().copied().unwrap_or(0),
                kickers.get(1).copied().unwrap_or(0),
                kickers.get(2).copied().unwrap_or(0),
                0,
            ],
        };
    }

    HandScore {
        rank: HandRank::HighCard,
        tiebreakers: [ranks[0], ranks[1], ranks[2], ranks[3], ranks[4]],
    }
}

fn is_straight_hand(ranks: &[u8]) -> bool {
    if ranks.len() != 5 {
        return false;
    }
    // Normal straight check (sorted descending)
    let normal = ranks[0] - ranks[4] == 4
        && ranks.windows(2).all(|w| w[0] == w[1] + 1);
    // Ace-low straight: A-2-3-4-5 → sorted as [12, 3, 2, 1, 0]
    let ace_low = ranks == [12, 3, 2, 1, 0];
    normal || ace_low
}

/// Determine winners from a list of (player_index, cards) pairs.
/// Returns indices of winners (can be multiple for split pot).
pub fn determine_winners(hands: &[(usize, Vec<u8>)]) -> Vec<usize> {
    if hands.is_empty() {
        return vec![];
    }

    let scores: Vec<(usize, HandScore)> = hands
        .iter()
        .map(|(idx, cards)| (*idx, evaluate_hand(cards)))
        .collect();

    let best_score = scores.iter().map(|(_, s)| s).max().unwrap();

    scores
        .iter()
        .filter(|(_, s)| s == best_score)
        .map(|(idx, _)| *idx)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_royal_flush() {
        // A, K, Q, J, 10 of Hearts (suit 0)
        let cards = [12, 11, 10, 9, 8]; // all hearts
        let score = evaluate_hand(&cards);
        assert_eq!(score.rank, HandRank::RoyalFlush);
    }

    #[test]
    fn test_straight_flush() {
        // 9, 8, 7, 6, 5 of Hearts
        let cards = [7, 6, 5, 4, 3];
        let score = evaluate_hand(&cards);
        assert_eq!(score.rank, HandRank::StraightFlush);
    }

    #[test]
    fn test_four_of_a_kind() {
        // Four Aces + a King
        let cards = [12, 12 + 13, 12 + 26, 12 + 39, 11];
        let score = evaluate_hand(&cards);
        assert_eq!(score.rank, HandRank::FourOfAKind);
    }

    #[test]
    fn test_full_house() {
        // Three Kings + Two Queens
        let cards = [11, 11 + 13, 11 + 26, 10, 10 + 13];
        let score = evaluate_hand(&cards);
        assert_eq!(score.rank, HandRank::FullHouse);
    }

    #[test]
    fn test_pair() {
        let cards = [12, 12 + 13, 8, 5, 2];
        let score = evaluate_hand(&cards);
        assert_eq!(score.rank, HandRank::OnePair);
    }

    #[test]
    fn test_seven_card_eval() {
        // 7 cards: best hand should be found
        let cards = [12, 12 + 13, 12 + 26, 12 + 39, 11, 5, 2]; // four aces
        let score = evaluate_hand(&cards);
        assert_eq!(score.rank, HandRank::FourOfAKind);
    }
}
