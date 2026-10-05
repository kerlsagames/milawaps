"use client";

import { useSyncExternalStore } from "react";
import { setAudioMuted } from "@/lib/audio";
import { VIEWS, type ViewId } from "@/lib/game";
import { staffFromToken } from "@/lib/who";

const TOKEN_KEY = "ott-token";
const TOKEN_EXP_KEY = "ott-token-exp";

export type DwellMap = Record<ViewId, number>;

export type DeskPrefs = {
  kiosk: boolean;
  muted: boolean;
  token: string | null;
  dwells: DwellMap;
};

export const MIN_DWELL_SECONDS = 5;
export const MAX_DWELL_SECONDS = 60;

export const DEFAULT_DWELLS: DwellMap = {
  board: 14,
  prizes: 12,
  yard: 12,
};

const serverPrefs: DeskPrefs = {
  kiosk: false,
  muted: false,
  token: null,
  dwells: DEFAULT_DWELLS,
};

let current: DeskPrefs = serverPrefs;
const listeners = new Set<() => void>();

function readToken(): string | null {
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_EXP_KEY);
  const saved = window.localStorage.getItem(TOKEN_KEY);
  const expires = Number(window.localStorage.getItem(TOKEN_EXP_KEY) || 0);
  if (saved && expires > Date.now() && staffFromToken(saved)) return saved;
  if (saved) {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(TOKEN_EXP_KEY);
  }
  return null;
}

function clampDwell(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(MIN_DWELL_SECONDS, Math.min(MAX_DWELL_SECONDS, Math.round(value)));
}

function readDwells(): DwellMap {
  const legacyRaw = window.localStorage.getItem("ott-kiosk-seconds");
  const legacy = legacyRaw == null ? null : Number(legacyRaw);
  let stored: Record<string, unknown> = {};
  try {
    const raw = window.localStorage.getItem("ott-kiosk-dwells");
    if (raw) stored = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    stored = {};
  }
  const dwells = { ...DEFAULT_DWELLS };
  for (const view of VIEWS) {
    const saved = stored[view.id];
    const previous =
      view.id === "yard" && typeof saved !== "number" ? stored.map ?? stored.rules : saved;
    if (typeof previous === "number") dwells[view.id] = clampDwell(previous, DEFAULT_DWELLS[view.id]);
    else if (legacy != null && Number.isFinite(legacy)) {
      dwells[view.id] = clampDwell(legacy, DEFAULT_DWELLS[view.id]);
    }
  }
  return dwells;
}

function readPrefs(): DeskPrefs {
  return {
    kiosk: window.localStorage.getItem("ott-kiosk") === "1",
    muted: window.localStorage.getItem("ott-muted") === "1",
    token: readToken(),
    dwells: readDwells(),
  };
}

function publish(next: DeskPrefs) {
  current = next;
  setAudioMuted(next.muted);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  current = readPrefs();
  setAudioMuted(current.muted);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return current;
}

export function useDeskPrefs() {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverPrefs);
}

export function setKioskPref(kiosk: boolean) {
  window.localStorage.setItem("ott-kiosk", kiosk ? "1" : "0");
  publish({ ...readPrefs(), kiosk });
}

export function setMutedPref(muted: boolean) {
  window.localStorage.setItem("ott-muted", muted ? "1" : "0");
  publish({ ...readPrefs(), muted });
}

export function setViewDwell(view: ViewId, seconds: number) {
  const dwells = {
    ...readDwells(),
    [view]: clampDwell(seconds, DEFAULT_DWELLS[view]),
  };
  window.localStorage.setItem("ott-kiosk-dwells", JSON.stringify(dwells));
  publish({ ...readPrefs(), dwells });
}

export function saveToken(token: string, expiresAt: number) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(TOKEN_EXP_KEY, String(expiresAt));
  publish({ ...readPrefs(), token });
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(TOKEN_EXP_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_EXP_KEY);
  publish({ ...readPrefs(), token: null });
}
