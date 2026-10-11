import test from "node:test";
import assert from "node:assert/strict";
import { latestOdds } from "../lib/latest-odds";
import type { OddsSnapshot } from "../lib/types";
test("odds uses the newest snapshot regardless of query order", () => {
  const old: OddsSnapshot = { id: "old", team_id: "team", fetched_at: "2026-10-09T00:00:00Z", championship_odds: 200, r1_win_prob: 0.5 };
  const fresh = { ...old, id: "new", fetched_at: "2026-10-10T00:00:00Z", championship_odds: 100 };
  for (const values of [[old, fresh], [fresh, old]]) assert.equal(latestOdds(values).get("team")?.id, "new");
});
