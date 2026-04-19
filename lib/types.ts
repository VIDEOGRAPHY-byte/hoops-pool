export type Conference = "East" | "West";
export type Round = 1 | 2 | 3 | 4;

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  seed: number;
  conference: Conference;
  logo_url?: string;
}

export interface Series {
  id: string;
  round: Round;
  conference: Conference | "Finals";
  slot: number; // position within round
  team_a_id: string | null;
  team_b_id: string | null;
  winner_id: string | null;
  games: number | null; // games played to finish
  locked: boolean;
  team_a?: Team;
  team_b?: Team;
  winner?: Team;
}

export interface Participant {
  id: string;
  pool_id: string;
  display_name: string;
  created_at: string;
}

export interface Pick {
  id: string;
  participant_id: string;
  series_id: string;
  picked_team_id: string;
  games_prediction: number | null; // 4-7
  locked: boolean;
  created_at: string;
}

export interface OddsSnapshot {
  id: string;
  team_id: string;
  championship_odds: number; // American odds e.g. +350
  r1_win_prob: number; // 0-1
  fetched_at: string;
}

export interface Pool {
  id: string;
  name: string;
  passcode: string;
  picks_locked_at: string | null;
}

export interface LeaderboardEntry {
  participant: Participant;
  total_points: number;
  correct_picks: number;
  possible_points: number;
  rank: number;
}

export interface ScoreBreakdown {
  series_id: string;
  points_earned: number;
  points_possible: number;
  correct: boolean;
}
