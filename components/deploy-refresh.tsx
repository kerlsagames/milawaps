"use client";

import { useEffect } from "react";

const CHECK_MS = 60_000;

/**
 * Kiosk laptops stay on one tab for hours. Poll the deploy build id and
 * hard-reload when main ships a new version so UI changes appear without
 * someone walking over to refresh the TV.
 */
export function DeployRefresh() {
  useEffect(() => {
    let known: string | null = null;
    let reloading = false;
    let cancelled = false;

    async function check() {
      if (cancelled || reloading) return;
      try {
        const response = await fetch("/api/version", { cache: "no-store" });
        if (!response.ok) return;
        const body = (await response.json().catch(() => ({}))) as { buildId?: unknown };
        if (typeof body.buildId !== "string" || !body.buildId) return;
        if (known == null) {
          known = body.buildId;
          return;
        }
        if (body.buildId !== known) {
          reloading = true;
          window.location.reload();
        }
      } catch {
        // Offline TVs keep running on the current build until the next check.
      }
    }

    void check();
    const id = window.setInterval(() => void check(), CHECK_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
    };
  }, []);

  return null;
}
