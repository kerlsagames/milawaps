import {
  ACTION_COPY,
  CLASS_MILESTONES,
  UNIT_IDS,
  VAULT_MILESTONES,
  type ActionId,
  type MilestoneEvent,
  type ScoreLogEntry,
  type ScoreState,
  type StaffId,
  type UnitId,
  clampScore,
  emptyScores,
  isActionId,
  isStaffId,
  isUnitId,
  vaultTotal,
} from "@/lib/game";

export function sanitizeScores(raw: unknown): ScoreState {
  const base = emptyScores();
  if (!raw || typeof raw !== "object") return base;
  const record = raw as Partial<ScoreState>;
  const units = record.units;
  if (units && typeof units === "object") {
    for (const id of UNIT_IDS) {
      const value = (units as Record<string, unknown>)[id];
      base.units[id] = clampScore(typeof value === "number" ? value : Number(value));
    }
  }
  base.updatedAt =
    typeof record.updatedAt === "number" && Number.isFinite(record.updatedAt)
      ? record.updatedAt
      : base.updatedAt;
  const last = record.lastAction;
  if (
    last &&
    typeof last === "object" &&
    (last.action === "spot" ||
      last.action === "surge" ||
      last.action === "strike" ||
      last.action === "teamwork") &&
    (last.unitId === "all" ||
      last.unitId === "f1" ||
      last.unitId === "234" ||
      last.unitId === "56") &&
    typeof last.at === "number"
  ) {
    const staffId = isStaffId(last.staffId) ? last.staffId : undefined;
    base.lastAction = {
      action: last.action,
      unitId: last.unitId,
      at: last.at,
      staffId,
    };
  }
  if (Array.isArray(record.log)) {
    const log: ScoreLogEntry[] = [];
    for (const item of record.log) {
      if (!item || typeof item !== "object") continue;
      const entry = item as Partial<ScoreLogEntry>;
      if (!isActionId(entry.action) || !isStaffId(entry.staffId)) continue;
      if (entry.unitId !== "all" && !isUnitId(entry.unitId)) continue;
      if (typeof entry.at !== "number") continue;
      if (entry.action !== "reset" && entry.action !== "teamwork" && entry.unitId === "all") {
        continue;
      }
      log.push({
        action: entry.action,
        unitId: entry.unitId,
        at: entry.at,
        staffId: entry.staffId,
      });
      if (log.length === 40) break;
    }
    base.log = log;
  }
  return base;
}

export function milestonesBetween(
  before: Record<UnitId, number>,
  after: Record<UnitId, number>,
): MilestoneEvent[] {
  const events: MilestoneEvent[] = [];
  for (const id of UNIT_IDS) {
    for (const milestone of CLASS_MILESTONES) {
      if (before[id] < milestone.points && after[id] >= milestone.points) {
        events.push({ ...milestone, scope: "unit", unitId: id });
      }
    }
  }
  const beforeVault = vaultTotal(before);
  const afterVault = vaultTotal(after);
  for (const milestone of VAULT_MILESTONES) {
    if (beforeVault < milestone.points && afterVault >= milestone.points) {
      events.push({ ...milestone, scope: "vault" });
    }
  }
  return events;
}

function pushLog(state: ScoreState, entry: ScoreLogEntry): ScoreLogEntry[] {
  return [entry, ...(state.log ?? [])].slice(0, 40);
}

export function applyAction(
  state: ScoreState,
  action: ActionId,
  unitId: UnitId | undefined,
  staffId: StaffId,
  now = Date.now(),
): { state: ScoreState; events: MilestoneEvent[] } {
  const entry: ScoreLogEntry = {
    action,
    unitId: action === "teamwork" || action === "reset" ? "all" : (unitId as UnitId),
    at: now,
    staffId,
  };

  if (action === "reset") {
    return {
      state: { ...emptyScores(now), log: pushLog(state, entry) },
      events: [],
    };
  }

  if (action !== "teamwork" && !unitId) {
    throw new Error("A unit is required for this score.");
  }

  const before = { ...state.units };
  const next = { ...state.units };

  if (action === "teamwork") {
    for (const id of UNIT_IDS) {
      next[id] = clampScore(next[id] + ACTION_COPY.teamwork.delta);
    }
  } else if (unitId) {
    next[unitId] = clampScore(next[unitId] + ACTION_COPY[action].delta);
  }

  const updated: ScoreState = {
    units: next,
    updatedAt: now,
    lastAction: {
      action,
      unitId: action === "teamwork" ? "all" : (unitId as UnitId),
      at: now,
      staffId,
    },
    log: pushLog(state, entry),
  };

  return {
    state: updated,
    events: milestonesBetween(before, next),
  };
}
