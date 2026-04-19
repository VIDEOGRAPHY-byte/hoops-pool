"use client";

import { useState, useTransition } from "react";
import { lockPick } from "@/app/(pool)/actions";
import type { Series } from "@/lib/types";

interface PickModalProps {
  series: Series;
  currentPickTeamId?: string;
  currentGames?: number;
  onClose: () => void;
  onSaved: () => void;
}