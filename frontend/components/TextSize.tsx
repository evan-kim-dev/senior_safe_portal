"use client";

import { useEffect } from "react";
import { applyTextSize, loadGuardian } from "@/lib/client/guardian";

export function TextSize() {
  useEffect(() => {
    applyTextSize(loadGuardian().textSize);
  }, []);

  return null;
}
