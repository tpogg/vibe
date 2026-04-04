// Re-export data from the existing JS file with types
export type Technique = {
  id: string; name: string; description: string; tier: 'beginner' | 'intermediate' | 'advanced';
  icon: string; xpReward: number; cost: number; category: string;
  tips: string[]; bestScore: number; completed: boolean;
};

export type Champion = {
  name: string; icon: string; roles: string[]; winRate: string; pickRate: string;
  banRate: string; tier: string; difficulty: number; coreItems: string[];
  counters: string[]; synergies: string[]; tips: string;
};

export type TftComp = {
  name: string; tier: string; units: string[]; items: string;
  description: string; winRate: string;
};

export type NewsItem = { title: string; tag: string; excerpt: string; date: string; };
export type LeaderboardEntry = { rank: number; name: string; score: number; level: number; title: string; };
export type Clip = { title: string; author: string; views: string; likes: string; icon: string; description: string; };
export type Discussion = { title: string; author: string; replies: number; views: string; preview: string; };

// These are loaded globally from js/data.js
declare global {
  var TECHNIQUES: Technique[];
  var CHAMPIONS: Champion[];
  var TIER_LIST: Record<string, string[]>;
  var TFT_COMPS: TftComp[];
  var NEWS_ITEMS: NewsItem[];
  var LEADERBOARD: LeaderboardEntry[];
  var CLIPS: Clip[];
  var DISCUSSIONS: Discussion[];
  var AI_RESPONSES: Record<string, string>;
}

export { };
