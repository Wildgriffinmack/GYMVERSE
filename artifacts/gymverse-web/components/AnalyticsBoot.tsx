"use client";

import { useEffect } from "react";
import { initAnalytics, track } from "@/lib/analytics";

let tracked = false;

/** Captures first-touch attribution for this page load and records a page view (once, even under Strict Mode). */
export function AnalyticsBoot({ heroVariant }: { heroVariant: string }) {
  useEffect(() => {
    initAnalytics(heroVariant);
    if (tracked) return;
    tracked = true;
    track("page_view", { path: window.location.pathname });
  }, [heroVariant]);
  return null;
}
