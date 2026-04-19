"use client";

import { useState } from "react";
import type { Series, Team } from "@/lib/types";

interface AdminPanelProps {
  series: Series[];
  teams: Team[];
}
