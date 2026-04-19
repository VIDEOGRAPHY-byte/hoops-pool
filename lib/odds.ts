export interface EspnOddsItem {
  teamAbbr: string;
  championshipOdds: number; // American odds
  r1WinProb: number; // 0-1
}

// ESPN BET futures endpoint (public, no auth needed)
const ESPN_FUTURES_URL =
  "https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/events/futures";

export async function fetchEspnOdds(): Promise<EspnOddsItem[]> {
  try {
    const res = await fetch(ESPN_FUTURES_URL, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    // ESPN returns items array with competitor data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: EspnOddsItem[] = (data?.items ?? []).map((item: any) => ({
      teamAbbr: item?.competitor?.abbreviation ?? "",
      championshipOdds: item?.odds?.moneyLine ?? 0,
      r1WinProb: item?.odds?.winProbability ?? 0.5,
    }));
    return items.filter((i) => i.teamAbbr);
  } catch {
    return [];
  }
}

export function americanToImplied(american: number): number {
  if (american > 0) return 100 / (american + 100);
  return Math.abs(american) / (Math.abs(american) + 100);
}

export function formatAmericanOdds(odds: number): string {
  if (odds === 0) return "—";
  return odds > 0 ? `+${odds}` : `${odds}`;
}
