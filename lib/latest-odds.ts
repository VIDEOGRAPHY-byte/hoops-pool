import type { OddsSnapshot } from "./types";

export function latestOdds(snapshots: OddsSnapshot[]): Map<string, OddsSnapshot> {
  const result = new Map<string, OddsSnapshot>();
  for (const snapshot of snapshots) {
    const previous = result.get(snapshot.team_id);
    if (!previous || Date.parse(snapshot.fetched_at) > Date.parse(previous.fetched_at)) {
      result.set(snapshot.team_id, snapshot);
    }
  }
  return result;
}
