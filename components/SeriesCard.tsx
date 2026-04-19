"use client";

import type { Series, Pick, OddsSnapshot } from "@/lib/types";

interface SeriesCardProps {
  series: Series;
  pick: Pick | undefined;
  oddsMap: Map<string, OddsSnapshot>;
  showOdds: boolean;
  onPickClick: (series: Series) => void;
}