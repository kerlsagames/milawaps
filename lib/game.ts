export const UNIT_IDS = ["f1", "234", "56"] as const;

export type UnitId = (typeof UNIT_IDS)[number];

export const UNIT_MAX = 60;
export const STRIKE_MAX = 30;
export const VAULT_TARGET = UNIT_MAX * UNIT_IDS.length;
/** School meter fills when the three classes add up to this many squares. */
export const SCHOOL_GOAL = 150;
export const PIN_LENGTH = 6;

export const VIEWS = [
  { id: "board", label: "Leaderboard", short: "Board", ms: 14_000 },
  { id: "prizes", label: "Prizes", short: "Prizes", ms: 12_000 },
  { id: "yard", label: "Yard & Rules", short: "Yard", ms: 12_000 },
] as const;

export type ViewId = (typeof VIEWS)[number]["id"];

export type ScoreAction = "spot" | "surge" | "strike" | "teamwork";
export type ActionId = ScoreAction | "reset" | "undo";

export const STAFF = [
  { id: "jess", name: "Jess", kid: "Miss B" },
  { id: "craig", name: "Craig", kid: "Mr Kerlin" },
  { id: "ash", name: "Ash", kid: "Mr C" },
  { id: "ricky", name: "Ricky", kid: "Mr Petts" },
  { id: "tiff", name: "Tiff", kid: "Mrs Stirling" },
  { id: "doug", name: "Doug", kid: "Doug" },
  { id: "hunter", name: "Hunter", kid: "Hunter" },
  { id: "jenny", name: "Jenny", kid: "Jenny" },
  { id: "charlie", name: "Charlie", kid: "Charlie" },
  { id: "richard", name: "Richard", kid: "Mr Hall" },
  { id: "maria", name: "Maria", kid: "Mrs Rinaldi" },
] as const;

export type StaffId = (typeof STAFF)[number]["id"];

export type LastAction = {
  action: ScoreAction;
  unitId: UnitId | "all";
  at: number;
  staffId?: StaffId;
};

export type ScoreLogEntry = {
  id: string;
  action: ActionId;
  unitId: UnitId | "all";
  at: number;
  staffId: StaffId;
  reason: string | null;
};

export type ReasonRecord = {
  id: string;
  at: number;
  staffId: StaffId;
  unitId: UnitId | "all";
  action: ScoreAction;
  reason: string;
};

export type ScoreState = {
  units: Record<UnitId, number>;
  crosses: Record<UnitId, number>;
  updatedAt: number;
  lastAction: LastAction | null;
  log: ScoreLogEntry[];
  reasons: ReasonRecord[];
};

export type SecurityState = {
  fails: number;
  lockedUntil: number;
};

export type StorageMode = "kv" | "file" | "memory";

export type PublicBoard = {
  units: Record<UnitId, number>;
  crosses: Record<UnitId, number>;
  updatedAt: number;
  lastAction: LastAction | null;
  log: ScoreLogEntry[];
  reasons: ReasonRecord[];
  vault: number;
  storage: StorageMode;
  news: import("@/lib/news").DailyNews;
  highlights: import("@/lib/highlights").HighlightEntry[];
  /** Shared TV playlist: which screens are on for every visitor. */
  shown: import("@/lib/reveals").ShownMap;
  /** Shared Jimmy cricket short code for every visitor. */
  cricketCode: string;
  /** When shared TV pages were last saved by an admin (0 = never). */
  displayUpdatedAt: number;
  /** Shared Daily News TV layout. */
  newsLayout: import("@/lib/site-display").NewsLayoutId;
  /** Which cricket panels are on for every visitor. */
  cricketPanels: import("@/lib/site-display").CricketPanels;
};

export type Milestone = {
  points: number;
  title: string;
  short: string;
  detail: string;
  secret: boolean;
};

export type MilestoneEvent = Milestone & {
  scope: "unit" | "vault";
  unitId?: UnitId;
};

export const CLASS_MILESTONES: Milestone[] = [
  {
    points: 15,
    title: "Game with Mr K",
    short: "Mr K",
    detail: "A game with Mr K for the class that hits 15.",
    secret: true,
  },
  {
    points: 30,
    title: "Teacher Takedown #1",
    short: "Takedown #1",
    detail: "Teacher Takedown #1. The class finds out on the day.",
    secret: true,
  },
  {
    points: 45,
    title: "Laser Tag",
    short: "Laser",
    detail: "Laser tag for your class.",
    secret: true,
  },
  {
    points: 60,
    title: "Teacher Takedown #2",
    short: "Takedown #2",
    detail: "Teacher Takedown #2. The teachers look nervous.",
    secret: true,
  },
];

export const VAULT_MILESTONES: Milestone[] = [];

/** Staff desk only. These stay off the TV. */
export const STAFF_MYSTERY_IDEAS = [
  "Whipped cream pie in a teacher's face",
  "Ice bucket a teacher",
  "Dress up a teacher",
];

export type UnitTheme = {
  id: UnitId;
  code: string;
  name: string;
  zoneLine: string;
  places: string[];
  color: string;
  deep: string;
  ink: string;
  soft: string;
};

export const UNITS: UnitTheme[] = [
  {
    id: "f1",
    code: "F/1",
    name: "Foundation & Year 1",
    zoneLine: "Oval & Construction",
    places: ["Oval", "Construction"],
    color: "#f5b942",
    deep: "#a86a12",
    ink: "#2a1c04",
    soft: "rgba(245, 185, 66, 0.18)",
  },
  {
    id: "234",
    code: "2/3/4",
    name: "Years 2, 3 & 4",
    zoneLine: "BER Deck, Toilets & Playground",
    places: ["BER Deck", "Toilets", "Playground"],
    color: "#2ec9a0",
    deep: "#0d7a64",
    ink: "#04241c",
    soft: "rgba(46, 201, 160, 0.18)",
  },
  {
    id: "56",
    code: "5/6",
    name: "Years 5 & 6",
    zoneLine: "Courts, Bin Area & Grass Playground",
    places: ["Courts", "Bin Area", "Grass Playground"],
    color: "#8b7cf7",
    deep: "#5146b8",
    ink: "#160f33",
    soft: "rgba(139, 124, 247, 0.2)",
  },
];

export const ACTION_COPY: Record<
  ScoreAction,
  { label: string; short: string; detail: string; delta: number }
> = {
  spot: {
    label: "Great things",
    short: "+1",
    detail:
      "One point when kids do something great. A tidy patch counts, and so does helping, leading, or a job done properly.",
    delta: 1,
  },
  surge: {
    label: "Epic Surge",
    short: "+2 Surge",
    detail: "Points for outstanding cleaning or something amazing.",
    delta: 2,
  },
  strike: {
    label: "Stray Strike",
    short: "−1 Strike",
    detail: "A sports ball, jumper, or rubbish cluster left behind. That takes one tidy square off.",
    delta: -1,
  },
  teamwork: {
    label: "Teamwork Bonus",
    short: "+3 All",
    detail: "Every unit banks three when the whole yard lifts together.",
    delta: 3,
  },
};

export function emptyScores(now = Date.now()): ScoreState {
  return {
    units: { f1: 0, "234": 0, "56": 0 },
    crosses: { f1: 0, "234": 0, "56": 0 },
    updatedAt: now,
    lastAction: null,
    log: [],
    reasons: [],
  };
}

export function isStaffId(value: unknown): value is StaffId {
  return typeof value === "string" && STAFF.some((person) => person.id === value);
}

export function staffName(id: string | null | undefined): string | null {
  return STAFF.find((person) => person.id === id)?.name ?? null;
}

export function kidName(id: string | null | undefined): string {
  return STAFF.find((person) => person.id === id)?.kid ?? "A teacher";
}

export function emptySecurity(): SecurityState {
  return { fails: 0, lockedUntil: 0 };
}

export function isUnitId(value: unknown): value is UnitId {
  return value === "f1" || value === "234" || value === "56";
}

export function isScoreAction(value: unknown): value is ScoreAction {
  return (
    value === "spot" ||
    value === "surge" ||
    value === "strike" ||
    value === "teamwork"
  );
}

export function isActionId(value: unknown): value is ActionId {
  return isScoreAction(value) || value === "reset" || value === "undo";
}

export function unitById(id: UnitId): UnitTheme {
  const unit = UNITS.find((item) => item.id === id);
  if (!unit) throw new Error(`Unknown unit ${id}`);
  return unit;
}

export function vaultTotal(units: Record<UnitId, number>): number {
  return units.f1 + units["234"] + units["56"];
}

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(UNIT_MAX, Math.round(value)));
}

export function clampStrike(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(STRIKE_MAX, Math.round(value)));
}

export function nextClassMilestone(score: number): Milestone | null {
  return CLASS_MILESTONES.find((milestone) => score < milestone.points) ?? null;
}

export function nextVaultMilestone(vault: number): Milestone | null {
  return VAULT_MILESTONES.find((milestone) => vault < milestone.points) ?? null;
}

export function actionLabel(action: LastAction): string {
  const copy = ACTION_COPY[action.action];
  const where = action.unitId === "all" ? "all units" : unitById(action.unitId).code;
  const who = action.staffId ? kidName(action.staffId) : null;
  return who ? `${who} · ${copy.label} · ${where}` : `${copy.label} · ${where}`;
}

export function scoreLogLabel(entry: ScoreLogEntry): string {
  const who = staffName(entry.staffId) ?? "Someone";
  if (entry.action === "reset") return `${who} cleared the board`;
  if (entry.action === "undo" || !isScoreAction(entry.action)) return `${who} undid a tick`;
  const copy = ACTION_COPY[entry.action];
  const where = entry.unitId === "all" ? "all units" : unitById(entry.unitId).code;
  const because = entry.reason ? ` · ${entry.reason}` : "";
  return `${who} · ${copy.short} · ${where}${because}`;
}

export function formatAgo(at: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
