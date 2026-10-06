"use client";

import { useSyncExternalStore } from "react";
import { setAudioMuted } from "@/lib/audio";
import { VIEWS } from "@/lib/game";
import {
  DEFAULT_SHOWN,
  REVEALS,
  SCREEN_IDS,
  type RevealId,
  type ScreenId,
  type ShownMap,
} from "@/lib/reveals";
import { staffFromToken } from "@/lib/who";

const TOKEN_KEY = "ott-token";
const TOKEN_EXP_KEY = "ott-token-exp";

export type DwellMap = Record<ScreenId, number>;

export type RevealPrefs = {
  at: number | null;
  prize: string;
};

export type RevealMap = Record<RevealId, RevealPrefs>;

export type DeskPrefs = {
  kiosk: boolean;
  muted: boolean;
  token: string | null;
  dwells: DwellMap;
  finishAt: number | null;
  shown: ShownMap;
  reveals: RevealMap;
};

export const MIN_DWELL_SECONDS = 5;
export const MAX_DWELL_SECONDS = 60;

export const DEFAULT_DWELLS: DwellMap = {
  board: 14,
  prizes: 12,
  yard: 12,
  "reveal-game": 12,
  "reveal-1": 12,
  "reveal-laser": 12,
  "reveal-2": 12,
  "reveal-ice": 12,
  "reveal-3": 12,
};

function defaultReveals(): RevealMap {
  return Object.fromEntries(
    REVEALS.map((reveal) => [reveal.id, { at: null, prize: reveal.prize }]),
  ) as RevealMap;
}

const serverPrefs: DeskPrefs = {
  kiosk: false,
  muted: false,
  token: null,
  dwells: DEFAULT_DWELLS,
  finishAt: null,
  shown: DEFAULT_SHOWN,
  reveals: defaultReveals(),
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
  for (const id of SCREEN_IDS) {
    const saved = stored[id];
    const previous = id === "yard" && typeof saved !== "number" ? stored.map ?? stored.rules : saved;
    if (typeof previous === "number") dwells[id] = clampDwell(previous, DEFAULT_DWELLS[id]);
    else if (legacy != null && Number.isFinite(legacy) && VIEWS.some((view) => view.id === id)) {
      dwells[id] = clampDwell(legacy, DEFAULT_DWELLS[id]);
    }
  }
  return dwells;
}

function readShown(): ShownMap {
  let stored: Record<string, unknown> = {};
  try {
    const raw = window.localStorage.getItem("ott-kiosk-shown");
    if (raw) stored = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    stored = {};
  }
  const shown = { ...DEFAULT_SHOWN };
  for (const id of SCREEN_IDS) {
    if (typeof stored[id] === "boolean") shown[id] = stored[id];
  }
  return shown;
}

function readReveals(): RevealMap {
  let stored: Record<string, { at?: unknown; prize?: unknown }> = {};
  try {
    const raw = window.localStorage.getItem("ott-reveals");
    if (raw) stored = JSON.parse(raw) as Record<string, { at?: unknown; prize?: unknown }>;
  } catch {
    stored = {};
  }
  const reveals = defaultReveals();
  for (const reveal of REVEALS) {
    const saved = stored[reveal.id];
    const at = typeof saved?.at === "number" && Number.isFinite(saved.at) && saved.at > 0 ? saved.at : null;
    const prize = typeof saved?.prize === "string" ? saved.prize : reveal.prize;
    reveals[reveal.id] = { at, prize };
  }
  return reveals;
}

function readFinish(): number | null {
  const value = Number(window.localStorage.getItem("ott-finish-at"));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function readPrefs(): DeskPrefs {
  return {
    kiosk: window.localStorage.getItem("ott-kiosk") === "1",
    muted: window.localStorage.getItem("ott-muted") === "1",
    token: readToken(),
    dwells: readDwells(),
    finishAt: readFinish(),
    shown: readShown(),
    reveals: readReveals(),
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

export function setFinishAt(finishAt: number | null) {
  if (finishAt == null || !Number.isFinite(finishAt)) {
    window.localStorage.removeItem("ott-finish-at");
    publish({ ...readPrefs(), finishAt: null });
    return;
  }
  window.localStorage.setItem("ott-finish-at", String(finishAt));
  publish({ ...readPrefs(), finishAt });
}

export function setViewDwell(view: ScreenId, seconds: number) {
  const dwells = {
    ...readDwells(),
    [view]: clampDwell(seconds, DEFAULT_DWELLS[view]),
  };
  window.localStorage.setItem("ott-kiosk-dwells", JSON.stringify(dwells));
  publish({ ...readPrefs(), dwells });
}

export function setScreenShown(screen: ScreenId, shown: boolean) {
  const next = { ...readShown(), [screen]: shown };
  window.localStorage.setItem("ott-kiosk-shown", JSON.stringify(next));
  publish({ ...readPrefs(), shown: next });
}

export function setRevealAt(id: RevealId, at: number | null) {
  const reveals = readReveals();
  reveals[id] = {
    ...reveals[id],
    at: at != null && Number.isFinite(at) ? at : null,
  };
  window.localStorage.setItem("ott-reveals", JSON.stringify(reveals));
  publish({ ...readPrefs(), reveals });
}

export function setRevealPrize(id: RevealId, prize: string) {
  const reveals = readReveals();
  reveals[id] = { ...reveals[id], prize };
  window.localStorage.setItem("ott-reveals", JSON.stringify(reveals));
  publish({ ...readPrefs(), reveals });
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
