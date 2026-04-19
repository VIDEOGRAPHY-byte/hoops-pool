import type { Series, Round, Conference } from "./types";

export interface RoundGroup {
  round: Round;
  label: string;
  east: Series[];
  west: Series[];
  finals?: Series;
}

export function groupSeriesByRound(allSeries: Series[]): RoundGroup[] {
  const rounds: Round[] = [1, 2, 3, 4];
  const labels: Record<Round, string> = {
    1: "First Round",
    2: "Semifinals",
    3: "Conf Finals",
    4: "NBA Finals",
  };

  return rounds.map((round) => {
    const roundSeries = allSeries.filter((s) => s.round === round);
    if (round === 4) {
      return {
        round,
        label: labels[round],
        east: [],
        west: [],
        finals: roundSeries[0],
      };
    }
    return {
      round,
      label: labels[round],
      east: roundSeries
        .filter((s) => s.conference === "East")
        .sort((a, b) => a.slot - b.slot),
      west: roundSeries
        .filter((s) => s.conference === "West")
        .sort((a, b) => a.slot - b.slot),
    };
  });
}

export function getNextRoundSlot(
  currentRound: Round,
  currentSlot: number
): { round: Round; slot: number } | null {
  if (currentRound === 4) return null;
  const nextRound = (currentRound + 1) as Round;
  const nextSlot = Math.ceil(currentSlot / 2);
  return { round: nextRound, slot: nextSlot };
}
