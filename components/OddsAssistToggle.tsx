"use client";

import { useState } from "react";

interface OddsAssistToggleProps {
  enabled: boolean;
  onToggle: (v: boolean) => void;
}