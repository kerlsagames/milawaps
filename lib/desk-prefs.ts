"use client";

import { useSyncExternalStore } from "react";
import { VIEWS } from "@/lib/game";
import {
  DEFAULT_SHOWN,
  REVEALS,
  SCREEN_IDS,
  type FixedScreenId,
  type RevealId,
  type ShownMap,
} from "@/lib/reveals";
import {
  DEFAULT_CRICKET_PANELS,
  type CricketPanels,
  type NewsLayoutId,
} from "@/lib/site-display";
import { staffFromToken } from "@/lib/who";

function revealDefaultLabel(reveal: (typeof REVEALS)[number]) {
  return reveal.title;
}

const TOKEN_KEY = "ott-token";
const TOKEN_EXP_KEY = "ott-token-exp";

export type DwellMap = Record<FixedScreenId, number>;

export type RevealPrefs = {
  at: number | null;
  prize: string;
  label: string;
  image: string | null;
};

export type RevealMap = Record<RevealId, RevealPrefs>;

export type TimerStyle = "race" | "blocks";

export type DeskPrefs = {
  kiosk: boolean;
  token: string | null;
  dwells: DwellMap;
  finishAt: number | null;
  shown: ShownMap;
  reveals: RevealMap;
  timer: TimerStyle;
  cricketCode: string;
  newsLayout: NewsLayoutId;
  cricketPanels: CricketPanels;
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
  cricket: 16,
  news: 18,
  highlight: 16,
  today: 12,
  edit: 12,
};

function defaultReveals(): RevealMap {
  return Object.fromEntries(
    REVEALS.map((reveal) => [
      reveal.id,
      { at: null, prize: reveal.prize, label: revealDefaultLabel(reveal), image: null },
    ]),
  ) as RevealMap;
}

function readStoredImage(value: unknown): string | null {
  return typeof value === "string" && value.startsWith("data:image/") ? value : null;
}

const serverPrefs: DeskPrefs = {
  kiosk: false,
  token: null,
  dwells: DEFAULT_DWELLS,
  finishAt: null,
  shown: DEFAULT_SHOWN,
  reveals: defaultReveals(),
  timer: "blocks",
  cricketCode: "",
  newsLayout: "split",
  cricketPanels: { ...DEFAULT_CRICKET_PANELS },
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
  let stored: Record<string, { at?: unknown; prize?: unknown; label?: unknown; image?: unknown }> = {};
  try {
    const raw = window.localStorage.getItem("ott-reveals");
    if (raw) {
      stored = JSON.parse(raw) as Record<
        string,
        { at?: unknown; prize?: unknown; label?: unknown; image?: unknown }
      >;
    }
  } catch {
    stored = {};
  }
  const reveals = defaultReveals();
  for (const reveal of REVEALS) {
    const saved = stored[reveal.id];
    const at = typeof saved?.at === "number" && Number.isFinite(saved.at) && saved.at > 0 ? saved.at : null;
    const prize = typeof saved?.prize === "string" ? saved.prize : reveal.prize;
    const label =
      typeof saved?.label === "string" && saved.label.trim()
        ? saved.label.trim().slice(0, 40)
        : revealDefaultLabel(reveal);
    reveals[reveal.id] = { at, prize, label, image: readStoredImage(saved?.image) };
  }
  return reveals;
}

function readCricket(): string {
  return (window.localStorage.getItem("ott-cricket-code") || "").trim().slice(0, 300);
}

function readFinish(): number | null {
  const value = Number(window.localStorage.getItem("ott-finish-at"));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function readTimer(): TimerStyle {
  // Default: coloured rectangles. Only switch to the race if the TV chose it.
  return window.localStorage.getItem("ott-timer-style") === "race" ? "race" : "blocks";
}

function readNewsLayout(): NewsLayoutId {
  const raw = window.localStorage.getItem("ott-news-layout");
  return raw === "stack" || raw === "boards" || raw === "split" ? raw : "split";
}

function readCricketPanels(): CricketPanels {
  try {
    const raw = window.localStorage.getItem("ott-cricket-panels");
    if (!raw) return { ...DEFAULT_CRICKET_PANELS };
    const parsed = JSON.parse(raw) as Partial<CricketPanels>;
    return {
      lastNext: typeof parsed.lastNext === "boolean" ? parsed.lastNext : true,
      leaders: typeof parsed.leaders === "boolean" ? parsed.leaders : true,
      ladder: typeof parsed.ladder === "boolean" ? parsed.ladder : true,
      draw: typeof parsed.draw === "boolean" ? parsed.draw : true,
    };
  } catch {
    return { ...DEFAULT_CRICKET_PANELS };
  }
}

function readPrefs(): DeskPrefs {
  const cricketCode = readCricket();
  const shown = readShown();
  if (!cricketCode) shown.cricket = false;
  return {
    kiosk: window.localStorage.getItem("ott-kiosk") === "1",
    token: readToken(),
    dwells: readDwells(),
    finishAt: readFinish(),
    shown,
    reveals: readReveals(),
    timer: readTimer(),
    cricketCode,
    newsLayout: readNewsLayout(),
    cricketPanels: readCricketPanels(),
  };
}

function publish(next: DeskPrefs) {
  current = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  current = readPrefs();
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return current;
}

export function useDeskPrefs() {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverPrefs);
}

export function setTimerStyle(timer: TimerStyle) {
  window.localStorage.setItem("ott-timer-style", timer);
  publish({ ...readPrefs(), timer });
}

export function setKioskPref(kiosk: boolean) {
  window.localStorage.setItem("ott-kiosk", kiosk ? "1" : "0");
  publish({ ...readPrefs(), kiosk });
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

export function setViewDwell(view: FixedScreenId, seconds: number) {
  const dwells = {
    ...readDwells(),
    [view]: clampDwell(seconds, DEFAULT_DWELLS[view]),
  };
  window.localStorage.setItem("ott-kiosk-dwells", JSON.stringify(dwells));
  publish({ ...readPrefs(), dwells });
}

export function setScreenShown(screen: FixedScreenId, shown: boolean) {
  const next = { ...readShown(), [screen]: shown };
  window.localStorage.setItem("ott-kiosk-shown", JSON.stringify(next));
  publish({ ...readPrefs(), shown: next });
}

export function setNewsLayoutLocal(layout: NewsLayoutId) {
  window.localStorage.setItem("ott-news-layout", layout);
  publish({ ...readPrefs(), newsLayout: layout });
}

export function setCricketPanelsLocal(panels: CricketPanels) {
  window.localStorage.setItem("ott-cricket-panels", JSON.stringify(panels));
  publish({ ...readPrefs(), cricketPanels: panels });
}

/** Apply shared TV display settings from the server board (every visitor). */
export function hydrateDisplay(
  shown: ShownMap,
  cricketCode: string,
  extras?: {
    newsLayout?: NewsLayoutId;
    cricketPanels?: CricketPanels;
    finishAt?: number | null;
  },
) {
  const code = cricketCode.trim().slice(0, 300);
  window.localStorage.setItem("ott-kiosk-shown", JSON.stringify(shown));
  if (code) window.localStorage.setItem("ott-cricket-code", code);
  else window.localStorage.removeItem("ott-cricket-code");
  if (extras?.newsLayout) {
    window.localStorage.setItem("ott-news-layout", extras.newsLayout);
  }
  if (extras?.cricketPanels) {
    window.localStorage.setItem("ott-cricket-panels", JSON.stringify(extras.cricketPanels));
  }
  if (extras && "finishAt" in extras) {
    if (extras.finishAt == null || !Number.isFinite(extras.finishAt)) {
      window.localStorage.removeItem("ott-finish-at");
    } else {
      window.localStorage.setItem("ott-finish-at", String(extras.finishAt));
    }
  }
  publish({
    ...readPrefs(),
    shown: { ...shown },
    cricketCode: code,
    newsLayout: extras?.newsLayout ?? readNewsLayout(),
    cricketPanels: extras?.cricketPanels ?? readCricketPanels(),
    finishAt: extras && "finishAt" in extras ? (extras.finishAt ?? null) : readFinish(),
  });
}

/** Admin: save show/hide and cricket code for every milawaps visitor. */
export async function saveSiteDisplay(
  patch: {
    shown?: Partial<ShownMap>;
    cricketCode?: string;
    newsLayout?: NewsLayoutId;
    cricketPanels?: Partial<CricketPanels>;
    finishAt?: number | null;
  },
  adminToken: string,
): Promise<{ ok: true; board: import("@/lib/game").PublicBoard } | { ok: false; error: string }> {
  try {
    const response = await fetch("/api/display", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(patch),
    });
    const body = (await response.json().catch(() => ({}))) as import("@/lib/game").PublicBoard & {
      error?: string;
    };
    if (!response.ok) {
      return { ok: false, error: body.error ?? "Those TV pages did not save." };
    }
    hydrateDisplay(body.shown, body.cricketCode, {
      newsLayout: body.newsLayout,
      cricketPanels: body.cricketPanels,
      finishAt: body.finishAt,
    });
    return { ok: true, board: body };
  } catch {
    return { ok: false, error: "Those TV pages did not save." };
  }
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

export function resetReveals() {
  const reveals = defaultReveals();
  window.localStorage.setItem("ott-reveals", JSON.stringify(reveals));
  const shown = { ...readShown() };
  for (const reveal of REVEALS) shown[reveal.id] = false;
  window.localStorage.setItem("ott-kiosk-shown", JSON.stringify(shown));
  publish({ ...readPrefs(), reveals, shown });
}

export function setRevealPrize(id: RevealId, prize: string) {
  const reveals = readReveals();
  reveals[id] = { ...reveals[id], prize };
  window.localStorage.setItem("ott-reveals", JSON.stringify(reveals));
  publish({ ...readPrefs(), reveals });
}

export function setRevealLabel(id: RevealId, label: string) {
  const reveals = readReveals();
  reveals[id] = { ...reveals[id], label: label.trim().slice(0, 40) };
  window.localStorage.setItem("ott-reveals", JSON.stringify(reveals));
  publish({ ...readPrefs(), reveals });
}

export function setRevealImage(id: RevealId, image: string | null): boolean {
  const reveals = readReveals();
  const previous = reveals[id].image;
  reveals[id] = { ...reveals[id], image };
  try {
    window.localStorage.setItem("ott-reveals", JSON.stringify(reveals));
    publish({ ...readPrefs(), reveals });
    return true;
  } catch {
    reveals[id] = { ...reveals[id], image: previous };
    return false;
  }
}

export function setCricketCode(code: string) {
  const cricketCode = code.trim().slice(0, 300);
  if (cricketCode) window.localStorage.setItem("ott-cricket-code", cricketCode);
  else window.localStorage.removeItem("ott-cricket-code");
  const shown = { ...readShown(), cricket: cricketCode.length > 0 };
  window.localStorage.setItem("ott-kiosk-shown", JSON.stringify(shown));
  publish({ ...readPrefs(), cricketCode, shown });
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
