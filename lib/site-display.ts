import { DEFAULT_SHOWN, SCREEN_IDS, type ShownMap } from "@/lib/reveals";

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
};

export function emptySiteDisplay(): SiteDisplay {
  return {
    shown: { ...DEFAULT_SHOWN },
    cricketCode: "",
    updatedAt: 0,
    newsLayout: "split",
    cricketPanels: { ...DEFAULT_CRICKET_PANELS },
    finishAt: null,
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
  return {
    shown,
    cricketCode,
    updatedAt,
    newsLayout: sanitizeNewsLayout(record.newsLayout),
    cricketPanels: sanitizeCricketPanels(record.cricketPanels),
    finishAt: sanitizeFinishAt(record.finishAt),
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
  };
  const nextShown = { ...current.shown };
  let cricketCode = current.cricketCode;
  let newsLayout = current.newsLayout;
  let cricketPanels = { ...current.cricketPanels };
  let finishAt = current.finishAt;

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
    updatedAt: Date.now(),
  });
}
