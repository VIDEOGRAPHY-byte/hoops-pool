import type { Pick, Series, ScoreBreakdown } from "./types";

// Points per round for correct winner
const ROUND_POINTS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 8,
};

// Bonus points for correct games prediction
const GAMES_BONUS = 1;

export function scoreParticipant(
  picks: Pick[],
  series: Series[]
): ScoreBreakdown[] {
  const seriesMap = new Map(series.map((s) => [s.id, s]));

  return picks.map((pick) => {
    const s = seriesMap.get(pick.series_id);
    if (!s) {
      return {
        series_id: pick.series_id,
        points_earned: 0,
        points_possible: ROUND_POINTS[1],
        correct: false,
      };
    }

    const basePoints = ROUND_POINTS[s.round] ?? 1;
    const seriesComplete = !!s.winner_id;
    const correctWinner = s.winner_id === pick.picked_team_id;
    const correctGames =
      correctWinner && pick.games_prediction === s.games;

    const points_earned = seriesComplete
      ? correctWinner
        ? basePoints + (correctGames ? GAMES_BONUS : 0)
        : 0
      : 0;

    const points_possible = basePoints + GAMES_BONUS;

    return {
      series_id: pick.series_id,
      points_earned,
      points_possible,
      correct: correctWinner,
    };
  });
}

export function totalScore(breakdowns: ScoreBreakdown[]): number {
  return breakdowns.reduce((sum, b) => sum + b.points_earned, 0);
}

export function maxPossible(breakdowns: ScoreBreakdown[]): number {
  return breakdowns.reduce((sum, b) => sum + b.points_possible, 0);
}
