import {
  DEFAULT_SHOWN,
  REVEALS,
  SCREEN_IDS,
  type FixedScreenId,
  type RevealId,
  type ShownMap,
} from "@/lib/reveals";

/** Shared prize-reveal copy/time for every TV (same shape as desk localStorage). */
export type SharedRevealPrefs = {
  at: number | null;
  prize: string;
  label: string;
  image: string | null;
};

export type SharedRevealMap = Record<RevealId, SharedRevealPrefs>;

const MAX_REVEAL_IMAGE = 2_500_000;

function defaultSharedReveals(): SharedRevealMap {
  return Object.fromEntries(
    REVEALS.map((reveal) => [
      reveal.id,
      { at: null, prize: reveal.prize, label: reveal.title, image: null },
    ]),
  ) as SharedRevealMap;
}

function sanitizeRevealImage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (value.startsWith("data:image/")) return value.slice(0, MAX_REVEAL_IMAGE);
  if (value.startsWith("/")) return value.slice(0, 400);
  return null;
}

/** null = never saved school-wide; clients keep their own local reveals. */
export function sanitizeSharedReveals(raw: unknown): SharedRevealMap | null {
  if (!raw || typeof raw !== "object") return null;
  const saved = raw as Record<string, unknown>;
  const reveals = defaultSharedReveals();
  let sawAny = false;
  for (const reveal of REVEALS) {
    const row = saved[reveal.id];
    if (!row || typeof row !== "object") continue;
    sawAny = true;
    const record = row as {
      at?: unknown;
      prize?: unknown;
      label?: unknown;
      image?: unknown;
    };
    const at =
      typeof record.at === "number" && Number.isFinite(record.at) && record.at > 0
        ? Math.floor(record.at)
        : null;
    const prize = typeof record.prize === "string" ? record.prize.slice(0, 200) : reveal.prize;
    const label =
      typeof record.label === "string" && record.label.trim()
        ? record.label.trim().slice(0, 40)
        : reveal.title;
    reveals[reveal.id] = {
      at,
      prize,
      label,
      image: sanitizeRevealImage(record.image),
    };
  }
  return sawAny ? reveals : null;
}

export type DwellMap = Record<FixedScreenId, number>;

export const MIN_DWELL_SECONDS = 5;
export const MAX_DWELL_SECONDS = 60;

/** Default seconds per TV slide — overridden once an admin saves shared dwells. */
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

export function clampDwell(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(MIN_DWELL_SECONDS, Math.min(MAX_DWELL_SECONDS, Math.round(value)));
}

export function sanitizeDwells(raw: unknown): DwellMap {
  const dwells = { ...DEFAULT_DWELLS };
  if (!raw || typeof raw !== "object") return dwells;
  const saved = raw as Record<string, unknown>;
  for (const id of SCREEN_IDS) {
    const previous =
      id === "yard" && typeof saved[id] !== "number" ? saved.map ?? saved.rules : saved[id];
    if (typeof previous === "number") dwells[id] = clampDwell(previous, DEFAULT_DWELLS[id]);
  }
  return dwells;
}

/** One seconds value for every kiosk / desk slide (admin “time per slide”). */
export function dwellsForEveryScreen(seconds: number): DwellMap {
  const value = clampDwell(seconds, DEFAULT_DWELLS.board);
  const dwells = { ...DEFAULT_DWELLS };
  for (const id of SCREEN_IDS) dwells[id] = value;
  return dwells;
}

export const NEWS_LAYOUTS = [
  {
    id: "split",
    label: "Split",
    blurb: "Photo on the left, tilted sticky boards on the right.",
  },
  {
    id: "stack",
    label: "Stack",
    blurb: "Photo up top, then big reminder boards underneath.",
  },
  {
    id: "boards",
    label: "Big boards",
    blurb: "Two wide boards for reminders and coming up — biggest type.",
  },
] as const;

export type NewsLayoutId = (typeof NEWS_LAYOUTS)[number]["id"];

export type CricketPanels = {
  lastNext: boolean;
  leaders: boolean;
  ladder: boolean;
  draw: boolean;
};

export const DEFAULT_CRICKET_PANELS: CricketPanels = {
  lastNext: true,
  leaders: true,
  ladder: true,
  draw: true,
};

export type SiteDisplay = {
  shown: ShownMap;
  cricketCode: string;
  /** 0 means nobody has saved shared TV pages yet. */
  updatedAt: number;
  newsLayout: NewsLayoutId;
  cricketPanels: CricketPanels;
  /** Shared prize-path finish countdown (ms since epoch), or null if unset. */
  finishAt: number | null;
  /**
   * Shared seconds-per-slide for every TV.
   * null = never saved on the server; clients keep their own local times.
   */
  dwells: DwellMap | null;
  /**
   * Shared prize-reveal times/names/pictures for every TV.
   * null = never saved on the server; clients keep their own local reveals.
   */
  reveals: SharedRevealMap | null;
};

export function emptySiteDisplay(): SiteDisplay {
  return {
    shown: { ...DEFAULT_SHOWN },
    cricketCode: "",
    updatedAt: 0,
    newsLayout: "split",
    cricketPanels: { ...DEFAULT_CRICKET_PANELS },
    finishAt: null,
    dwells: null,
    reveals: null,
  };
}

function sanitizeFinishAt(value: unknown): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return Math.floor(value);
}

function sanitizeNewsLayout(value: unknown): NewsLayoutId {
  return NEWS_LAYOUTS.some((item) => item.id === value) ? (value as NewsLayoutId) : "split";
}

function sanitizeCricketPanels(raw: unknown): CricketPanels {
  const base = { ...DEFAULT_CRICKET_PANELS };
  if (!raw || typeof raw !== "object") return base;
  const record = raw as Partial<Record<keyof CricketPanels, unknown>>;
  for (const key of Object.keys(base) as (keyof CricketPanels)[]) {
    if (typeof record[key] === "boolean") base[key] = record[key];
  }
  // Keep at least one panel so the page is never blank.
  if (!base.lastNext && !base.leaders && !base.ladder && !base.draw) {
    return { ...DEFAULT_CRICKET_PANELS };
  }
  return base;
}

export function sanitizeSiteDisplay(raw: unknown): SiteDisplay {
  const base = emptySiteDisplay();
  if (!raw || typeof raw !== "object") return base;
  const record = raw as {
    shown?: unknown;
    cricketCode?: unknown;
    updatedAt?: unknown;
    newsLayout?: unknown;
    cricketPanels?: unknown;
    finishAt?: unknown;
    dwells?: unknown;
    reveals?: unknown;
  };
  const shown = { ...DEFAULT_SHOWN };
  if (record.shown && typeof record.shown === "object") {
    const saved = record.shown as Record<string, unknown>;
    for (const id of SCREEN_IDS) {
      if (typeof saved[id] === "boolean") shown[id] = saved[id];
    }
  }
  const cricketCode =
    typeof record.cricketCode === "string" ? record.cricketCode.trim().slice(0, 300) : "";
  if (!cricketCode) shown.cricket = false;
  const updatedAt =
    typeof record.updatedAt === "number" && Number.isFinite(record.updatedAt) && record.updatedAt > 0
      ? Math.floor(record.updatedAt)
      : 0;
  // Only materialise shared dwells when the blob actually stored them — otherwise
  // older saves must not wipe each TV's local slide times.
  const dwells =
    record.dwells && typeof record.dwells === "object" ? sanitizeDwells(record.dwells) : null;
  const reveals = sanitizeSharedReveals(record.reveals);
  return {
    shown,
    cricketCode,
    updatedAt,
    newsLayout: sanitizeNewsLayout(record.newsLayout),
    cricketPanels: sanitizeCricketPanels(record.cricketPanels),
    finishAt: sanitizeFinishAt(record.finishAt),
    dwells,
    reveals,
  };
}

/** Merge a partial admin patch into the current display settings. */
export function siteDisplayFromInput(raw: unknown, current: SiteDisplay): SiteDisplay {
  if (!raw || typeof raw !== "object") return current;
  const record = raw as {
    shown?: unknown;
    cricketCode?: unknown;
    newsLayout?: unknown;
    cricketPanels?: unknown;
    finishAt?: unknown;
    dwells?: unknown;
    reveals?: unknown;
  };
  const nextShown = { ...current.shown };
  let cricketCode = current.cricketCode;
  let newsLayout = current.newsLayout;
  let cricketPanels = { ...current.cricketPanels };
  let finishAt = current.finishAt;
  let dwells = current.dwells;
  let reveals = current.reveals;

  if (typeof record.cricketCode === "string") {
    cricketCode = record.cricketCode.trim().slice(0, 300);
  }
  if (record.shown && typeof record.shown === "object") {
    const saved = record.shown as Record<string, unknown>;
    for (const id of SCREEN_IDS) {
      if (typeof saved[id] === "boolean") nextShown[id] = saved[id];
    }
  }
  if (record.newsLayout !== undefined) {
    newsLayout = sanitizeNewsLayout(record.newsLayout);
  }
  if (record.cricketPanels !== undefined) {
    cricketPanels = sanitizeCricketPanels({ ...cricketPanels, ...(record.cricketPanels as object) });
  }
  if ("finishAt" in record) {
    finishAt = sanitizeFinishAt(record.finishAt);
  }
  if (record.dwells !== undefined && record.dwells !== null && typeof record.dwells === "object") {
    dwells = sanitizeDwells({ ...(current.dwells ?? DEFAULT_DWELLS), ...record.dwells });
  }
  if (record.reveals !== undefined && record.reveals !== null && typeof record.reveals === "object") {
    const base = current.reveals ?? defaultSharedReveals();
    reveals = sanitizeSharedReveals({ ...base, ...(record.reveals as object) });
  }

  const cricketPatched =
    record.shown &&
    typeof record.shown === "object" &&
    typeof (record.shown as { cricket?: unknown }).cricket === "boolean";

  // A new code turns cricket on unless the patch also sets cricket explicitly.
  if (cricketCode && !current.cricketCode && !cricketPatched) {
    nextShown.cricket = true;
  }
  if (!cricketCode) nextShown.cricket = false;

  return sanitizeSiteDisplay({
    shown: nextShown,
    cricketCode,
    newsLayout,
    cricketPanels,
    finishAt,
    dwells,
    reveals,
    updatedAt: Date.now(),
  });
}
