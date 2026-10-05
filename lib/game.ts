export const UNIT_IDS = ["f1", "234", "56"] as const;

export type UnitId = (typeof UNIT_IDS)[number];

export const UNIT_MAX = 55;
export const VAULT_TARGET = 130;

export const VIEWS = [
  { id: "board", label: "Leaderboard", short: "Board", ms: 14_000 },
  { id: "prizes", label: "Prizes", short: "Prizes", ms: 10_000 },
  { id: "map", label: "Yard Map", short: "Map", ms: 10_000 },
  { id: "rules", label: "Rules", short: "Rules", ms: 8_000 },
] as const;

export type ViewId = (typeof VIEWS)[number]["id"];

export type ScoreAction = "spot" | "surge" | "strike" | "teamwork";
export type ActionId = ScoreAction | "reset";

export type LastAction = {
  action: ScoreAction;
  unitId: UnitId | "all";
  at: number;
};

export type ScoreState = {
  units: Record<UnitId, number>;
  updatedAt: number;
  lastAction: LastAction | null;
};

export type SecurityState = {
  fails: number;
  lockedUntil: number;
};

export type StorageMode = "kv" | "file" | "memory";

export type PublicBoard = {
  units: Record<UnitId, number>;
  updatedAt: number;
  lastAction: LastAction | null;
  vault: number;
  storage: StorageMode;
};

export type Milestone = {
  points: number;
  title: string;
  short: string;
  detail: string;
};

export type MilestoneEvent = Milestone & {
  scope: "unit" | "vault";
  unitId?: UnitId;
};

export const CLASS_MILESTONES: Milestone[] = [
  {
    points: 30,
    title: "15m Extra Play",
    short: "Extra Play",
    detail: "The bell rings and the yard stays open for fifteen more minutes.",
  },
  {
    points: 42,
    title: "Icy Pole Party",
    short: "Icy Poles",
    detail: "The freezer opens. One icy pole for every tidy hand.",
  },
  {
    points: 50,
    title: "Staff Pie Target Unlocked",
    short: "Pie Target",
    detail: "The staffroom pie is officially in play.",
  },
];

export const VAULT_MILESTONES: Milestone[] = [
  {
    points: 90,
    title: "Dress Up Staff",
    short: "Dress Up",
    detail: "Yard duty arrives in full costume. No plain polo shirts.",
  },
  {
    points: 110,
    title: "Sponge Soak",
    short: "Sponge Soak",
    detail: "Sponges loaded. Staff versus the school, and the school is ready.",
  },
  {
    points: 130,
    title: "The Principal Haircut & Wild Style",
    short: "Haircut",
    detail: "Clippers out. The principal picks a wild style, live.",
  },
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
    zoneLine: "Oval & Construction Yard",
    places: ["Oval", "Construction Yard"],
    color: "#f5b942",
    deep: "#a86a12",
    ink: "#2a1c04",
    soft: "rgba(245, 185, 66, 0.18)",
  },
  {
    id: "234",
    code: "2/3/4",
    name: "Years 2, 3 & 4",
    zoneLine: "Toilet Block, BER Deck & Playground",
    places: ["Toilet Block", "BER Deck", "Playground"],
    color: "#2ec9a0",
    deep: "#0d7a64",
    ink: "#04241c",
    soft: "rgba(46, 201, 160, 0.18)",
  },
  {
    id: "56",
    code: "5/6",
    name: "Years 5 & 6",
    zoneLine: "Bin Area, Eating Area, Basketball Court & Grass",
    places: ["Bin Area", "Eating Area", "Basketball Court", "Grass"],
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
    label: "Spot Check Tick",
    short: "+1 Tick",
    detail: "A clean patch on your unit's ground.",
    delta: 1,
  },
  surge: {
    label: "Epic Surge",
    short: "+3 Surge",
    detail: "A deep clean or a surprise audit that passes.",
    delta: 3,
  },
  strike: {
    label: "Stray Strike",
    short: "−1 Strike",
    detail: "A sports ball, jumper, or rubbish cluster left behind.",
    delta: -1,
  },
  teamwork: {
    label: "Teamwork Bonus",
    short: "+2 All",
    detail: "Every unit banks two when the whole yard lifts together.",
    delta: 2,
  },
};

export function emptyScores(now = Date.now()): ScoreState {
  return {
    units: { f1: 0, "234": 0, "56": 0 },
    updatedAt: now,
    lastAction: null,
  };
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
  return isScoreAction(value) || value === "reset";
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

export function nextClassMilestone(score: number): Milestone | null {
  return CLASS_MILESTONES.find((milestone) => score < milestone.points) ?? null;
}

export function nextVaultMilestone(vault: number): Milestone | null {
  return VAULT_MILESTONES.find((milestone) => vault < milestone.points) ?? null;
}

export function actionLabel(action: LastAction): string {
  const copy = ACTION_COPY[action.action];
  if (action.unitId === "all") return `${copy.label} · all units`;
  return `${copy.label} · ${unitById(action.unitId).code}`;
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
