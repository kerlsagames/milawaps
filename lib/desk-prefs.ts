"use client";

import { useSyncExternalStore } from "react";
import { setAudioMuted } from "@/lib/audio";
import { staffFromToken } from "@/lib/who";

const TOKEN_KEY = "ott-token";
const TOKEN_EXP_KEY = "ott-token-exp";

export type DeskPrefs = {
  kiosk: boolean;
  muted: boolean;
  token: string | null;
  dwellSeconds: number;
};

export const MIN_DWELL_SECONDS = 5;
export const MAX_DWELL_SECONDS = 60;
export const DEFAULT_DWELL_SECONDS = 12;

const serverPrefs: DeskPrefs = {
  kiosk: false,
  muted: false,
  token: null,
  dwellSeconds: DEFAULT_DWELL_SECONDS,
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

function readDwell(): number {
  const value = Number(window.localStorage.getItem("ott-kiosk-seconds"));
  if (!Number.isFinite(value)) return DEFAULT_DWELL_SECONDS;
  return Math.max(MIN_DWELL_SECONDS, Math.min(MAX_DWELL_SECONDS, Math.round(value)));
}

function readPrefs(): DeskPrefs {
  return {
    kiosk: window.localStorage.getItem("ott-kiosk") === "1",
    muted: window.localStorage.getItem("ott-muted") === "1",
    token: readToken(),
    dwellSeconds: readDwell(),
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

export function setDwellSeconds(seconds: number) {
  const dwellSeconds = Math.max(
    MIN_DWELL_SECONDS,
    Math.min(MAX_DWELL_SECONDS, Math.round(seconds)),
  );
  window.localStorage.setItem("ott-kiosk-seconds", String(dwellSeconds));
  publish({ ...readPrefs(), dwellSeconds });
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
