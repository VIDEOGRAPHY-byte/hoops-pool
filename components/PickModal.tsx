"use client";

import { useState, useTransition, useEffect } from "react";
import { lockPick } from "@/app/(pool)/actions";
import type { Series, OddsSnapshot } from "@/lib/types";

interface PickModalProps {
  series: Series;
  currentPickTeamId?: string;
  currentGames?: number;
  oddsMap: Map<string, OddsSnapshot>;
  onClose: () => void;
  onSaved: (seriesId: string, pickedTeamId: string, gamesPrediction?: number) => void;
}