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
  /** Once true, the prize path stop stays open even if the TV reveal page is hidden. */
  unlocked: boolean;
};

export type SharedRevealMap = Record<RevealId, SharedRevealPrefs>;

const MAX_REVEAL_IMAGE = 2_500_000;

function defaultSharedReveals(): SharedRevealMap {
  return Object.fromEntries(
    REVEALS.map((reveal) => [
      reveal.id,
      { at: null, prize: reveal.prize, label: reveal.title, image: null, unlocked: false },
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
      unlocked?: unknown;
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
    const unlocked =
      record.unlocked === true || (typeof at === "number" && at <= Date.now());
    reveals[reveal.id] = {
      at,
      prize,
      label,
      image: sanitizeRevealImage(record.image),
      unlocked,
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
  "cricket-teams": 18,
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

/** Cricket 1 page mode — all team lists, or the next matchup big on screen. */
export const CRICKET_TEAMS_MODES = ["all", "next"] as const;
export type CricketTeamsMode = (typeof CRICKET_TEAMS_MODES)[number];

export function sanitizeCricketTeamsMode(raw: unknown): CricketTeamsMode {
  return raw === "next" ? "next" : "all";
}

/** Cricket 2 leader stats — whole school, one year level, or rotate on the TV. */
export const CRICKET_STATS_SCOPES = ["all", "56", "234", "f1", "rotate"] as const;
export type CricketStatsScope = (typeof CRICKET_STATS_SCOPES)[number];

/** Year bands (plus whole school) that can sit in a Cricket 2 rotate playlist. */
export const CRICKET_STATS_BANDS = ["all", "56", "234", "f1"] as const;
export type CricketStatsBand = (typeof CRICKET_STATS_BANDS)[number];

export const CRICKET_STATS_ROTATE_MIN = 5;
export const CRICKET_STATS_ROTATE_MAX = 60;
export const DEFAULT_CRICKET_STATS_ROTATE_SEC = 10;
export const DEFAULT_CRICKET_STATS_ROTATE_SCOPES: CricketStatsBand[] = [
  "all",
  "56",
  "234",
  "f1",
];

export function sanitizeCricketStatsScope(raw: unknown): CricketStatsScope {
  return CRICKET_STATS_SCOPES.includes(raw as CricketStatsScope)
    ? (raw as CricketStatsScope)
    : "all";
}

export function sanitizeCricketStatsRotateSec(raw: unknown): number {
  const number = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(number)) return DEFAULT_CRICKET_STATS_ROTATE_SEC;
  return Math.max(
    CRICKET_STATS_ROTATE_MIN,
    Math.min(CRICKET_STATS_ROTATE_MAX, Math.round(number)),
  );
}

/** Keep a stable band order; always leave at least one band in the playlist. */
export function sanitizeCricketStatsRotateScopes(raw: unknown): CricketStatsBand[] {
  if (!Array.isArray(raw)) return [...DEFAULT_CRICKET_STATS_ROTATE_SCOPES];
  const picked = new Set<CricketStatsBand>();
  for (const item of raw) {
    if (CRICKET_STATS_BANDS.includes(item as CricketStatsBand)) {
      picked.add(item as CricketStatsBand);
    }
  }
  const ordered = CRICKET_STATS_BANDS.filter((band) => picked.has(band));
  return ordered.length > 0 ? ordered : [...DEFAULT_CRICKET_STATS_ROTATE_SCOPES];
}

export function cricketStatsScopeLabel(scope: Exclude<CricketStatsScope, "rotate"> | "all") {
  if (scope === "56") return "5/6";
  if (scope === "234") return "2/3/4";
  if (scope === "f1") return "F/1";
  return "All";
}

/** Cricket 2 leader-stat cards teachers can put on the top row (pick up to 5). */
export const CRICKET_LEADER_STAT_IDS = [
  "runs",
  "wickets",
  "catches",
  "highest",
  "runOuts",
  "sixes",
  "fours",
] as const;
export type CricketLeaderStatId = (typeof CRICKET_LEADER_STAT_IDS)[number];

export const CRICKET_LEADER_STATS_MAX = 5;

export const DEFAULT_CRICKET_LEADER_STATS: CricketLeaderStatId[] = [
  "runs",
  "wickets",
  "catches",
  "highest",
  "runOuts",
];

export const CRICKET_LEADER_STAT_META: Record<
  CricketLeaderStatId,
  { title: string; tone: string }
> = {
  runs: { title: "Most runs", tone: "#2ec9a0" },
  wickets: { title: "Most wickets", tone: "#ff7a59" },
  catches: { title: "Most catches", tone: "#5ec8ff" },
  highest: { title: "Highest score", tone: "#e2a01a" },
  runOuts: { title: "Most run outs", tone: "#c48a16" },
  sixes: { title: "Most sixes", tone: "#7b4bff" },
  fours: { title: "Most fours", tone: "#1f6f8b" },
};

export function cricketLeaderStatLabel(id: CricketLeaderStatId) {
  return CRICKET_LEADER_STAT_META[id].title;
}

/** Keep selection order; clamp to 1–5 valid ids. */
export function sanitizeCricketLeaderStats(raw: unknown): CricketLeaderStatId[] {
  if (!Array.isArray(raw)) return [...DEFAULT_CRICKET_LEADER_STATS];
  const seen = new Set<CricketLeaderStatId>();
  const out: CricketLeaderStatId[] = [];
  for (const item of raw) {
    if (!CRICKET_LEADER_STAT_IDS.includes(item as CricketLeaderStatId)) continue;
    const id = item as CricketLeaderStatId;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= CRICKET_LEADER_STATS_MAX) break;
  }
  return out.length > 0 ? out : [...DEFAULT_CRICKET_LEADER_STATS];
}

/** Cricket 1 — player names under each team (keyed by team name). */
export type CricketRosters = Record<string, string[]>;

export function sanitizeCricketRosters(raw: unknown): CricketRosters {
  if (!raw || typeof raw !== "object") return {};
  const out: CricketRosters = {};
  for (const [name, players] of Object.entries(raw as Record<string, unknown>)) {
    const team = name.replace(/\s+/g, " ").trim().slice(0, 40);
    if (!team) continue;
    if (!Array.isArray(players)) continue;
    const list = players
      .flatMap((player) => {
        if (typeof player !== "string") return [];
        const value = player.replace(/\s+/g, " ").trim().slice(0, 40);
        return value ? [value] : [];
      })
      .slice(0, 24);
    out[team] = list;
  }
  return out;
}

export type SiteDisplay = {
  shown: ShownMap;
  cricketCode: string;
  /** 0 means nobody has saved shared TV pages yet. */
  updatedAt: number;
  newsLayout: NewsLayoutId;
  cricketPanels: CricketPanels;
  /** Cricket 1 team lists — who is on which team. */
  cricketRosters: CricketRosters;
  /** Cricket 1: all teams, or next-game matchup. */
  cricketTeamsMode: CricketTeamsMode;
  /** Cricket 2 leader stats: all / year level / rotate. */
  cricketStatsScope: CricketStatsScope;
  /** Seconds between year-level rotations when scope is rotate. */
  cricketStatsRotateSec: number;
  /** Which bands cycle when cricketStatsScope is rotate. */
  cricketStatsRotateScopes: CricketStatsBand[];
  /** Which Cricket 2 leader-stat cards show on the top row (up to 5). */
  cricketLeaderStats: CricketLeaderStatId[];
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
    cricketRosters: {},
    cricketTeamsMode: "all",
    cricketStatsScope: "all",
    cricketStatsRotateSec: DEFAULT_CRICKET_STATS_ROTATE_SEC,
    cricketStatsRotateScopes: [...DEFAULT_CRICKET_STATS_ROTATE_SCOPES],
    cricketLeaderStats: [...DEFAULT_CRICKET_LEADER_STATS],
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
    cricketRosters?: unknown;
    cricketTeamsMode?: unknown;
    cricketStatsScope?: unknown;
    cricketStatsRotateSec?: unknown;
    cricketStatsRotateScopes?: unknown;
    cricketLeaderStats?: unknown;
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
  if (!cricketCode) {
    shown.cricket = false;
    shown["cricket-teams"] = false;
  }
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
    cricketRosters: sanitizeCricketRosters(record.cricketRosters),
    cricketTeamsMode: sanitizeCricketTeamsMode(record.cricketTeamsMode),
    cricketStatsScope: sanitizeCricketStatsScope(record.cricketStatsScope),
    cricketStatsRotateSec: sanitizeCricketStatsRotateSec(record.cricketStatsRotateSec),
    cricketStatsRotateScopes: sanitizeCricketStatsRotateScopes(record.cricketStatsRotateScopes),
    cricketLeaderStats: sanitizeCricketLeaderStats(record.cricketLeaderStats),
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
    cricketRosters?: unknown;
    cricketTeamsMode?: unknown;
    cricketStatsScope?: unknown;
    cricketStatsRotateSec?: unknown;
    cricketStatsRotateScopes?: unknown;
    cricketLeaderStats?: unknown;
    finishAt?: unknown;
    dwells?: unknown;
    reveals?: unknown;
  };
  const nextShown = { ...current.shown };
  let cricketCode = current.cricketCode;
  let newsLayout = current.newsLayout;
  let cricketPanels = { ...current.cricketPanels };
  let cricketRosters = { ...current.cricketRosters };
  let cricketTeamsMode = current.cricketTeamsMode;
  let cricketStatsScope = current.cricketStatsScope;
  let cricketStatsRotateSec = current.cricketStatsRotateSec;
  let cricketStatsRotateScopes = current.cricketStatsRotateScopes;
  let cricketLeaderStats = current.cricketLeaderStats;
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
  if (record.cricketRosters !== undefined && record.cricketRosters !== null) {
    // Full replace so deleted teams disappear from Cricket 1.
    cricketRosters = sanitizeCricketRosters(record.cricketRosters);
  }
  if (record.cricketTeamsMode !== undefined) {
    cricketTeamsMode = sanitizeCricketTeamsMode(record.cricketTeamsMode);
  }
  if (record.cricketStatsScope !== undefined) {
    cricketStatsScope = sanitizeCricketStatsScope(record.cricketStatsScope);
  }
  if (record.cricketStatsRotateSec !== undefined) {
    cricketStatsRotateSec = sanitizeCricketStatsRotateSec(record.cricketStatsRotateSec);
  }
  if (record.cricketStatsRotateScopes !== undefined) {
    cricketStatsRotateScopes = sanitizeCricketStatsRotateScopes(record.cricketStatsRotateScopes);
  }
  if (record.cricketLeaderStats !== undefined) {
    cricketLeaderStats = sanitizeCricketLeaderStats(record.cricketLeaderStats);
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

  const shownPatch =
    record.shown && typeof record.shown === "object"
      ? (record.shown as { cricket?: unknown; "cricket-teams"?: unknown })
      : null;
  const cricketPatched = typeof shownPatch?.cricket === "boolean";
  const cricketTeamsPatched = typeof shownPatch?.["cricket-teams"] === "boolean";

  // A new code turns Cricket 2 on unless the patch also sets cricket explicitly.
  if (cricketCode && !current.cricketCode && !cricketPatched) {
    nextShown.cricket = true;
  }
  if (!cricketCode) {
    nextShown.cricket = false;
    nextShown["cricket-teams"] = false;
  }
  // Don't force Cricket 1 on for a new code — teachers opt in when rosters are ready.
  if (cricketTeamsPatched && !cricketCode) {
    nextShown["cricket-teams"] = false;
  }

  return sanitizeSiteDisplay({
    shown: nextShown,
    cricketCode,
    newsLayout,
    cricketPanels,
    cricketRosters,
    cricketTeamsMode,
    cricketStatsScope,
    cricketStatsRotateSec,
    cricketStatsRotateScopes,
    cricketLeaderStats,
    finishAt,
    dwells,
    reveals,
    updatedAt: Date.now(),
  });
}
