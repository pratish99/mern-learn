"use client";

import { useEffect } from "react";
import { useProgressStore } from "@/store/progress-store";

export default function VisitTracker() {
  const recordVisit = useProgressStore((s) => s.recordVisit);

  useEffect(() => {
    recordVisit();
  }, [recordVisit]);

  return null;
}
