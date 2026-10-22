import {
  ACTION_COPY,
  CLASS_MILESTONES,
  UNIT_IDS,
  VAULT_MILESTONES,
  type ActionId,
  type MilestoneEvent,
  type ReasonRecord,
  type ScoreAction,
  type ScoreLogEntry,
  type ScoreState,
  type StaffId,
  type UnitId,
  clampScore,
  clampStrike,
  emptyScores,
  isActionId,
  isScoreAction,
  isStaffId,
  isUnitId,
  vaultTotal,
} from "@/lib/game";

const LOG_LIMIT = 80;
const REASON_ARCHIVE = 200;
const REASON_WINDOW_MS = 3 * 60 * 1000;

export function cleanReason(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim().slice(0, 80);
  return text.length > 0 ? text : null;
}

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
  const crosses = record.crosses;
  if (crosses && typeof crosses === "object") {
    for (const id of UNIT_IDS) {
      const value = (crosses as Record<string, unknown>)[id];
      const count = clampStrike(typeof value === "number" ? value : Number(value));
      base.crosses[id] = count;
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
      const id =
        typeof entry.id === "string" && entry.id.length > 0 && entry.id.length <= 80
          ? entry.id
          : `legacy-${entry.at}-${entry.staffId}-${log.length}`;
      const delta =
        entry.action === "adjust" && (entry.delta === 1 || entry.delta === -1)
          ? entry.delta
          : undefined;
      if (entry.action === "adjust" && delta == null) continue;
      if (entry.action === "adjust" && entry.unitId === "all") continue;
      log.push({
        id,
        action: entry.action,
        unitId: entry.unitId,
        at: entry.at,
        staffId: entry.staffId,
        reason: cleanReason(entry.reason),
        ...(delta != null ? { delta } : {}),
      });
      if (log.length === LOG_LIMIT) break;
    }
    base.log = log;
  }
  if (Array.isArray(record.reasons)) {
    const reasons: ReasonRecord[] = [];
    for (const item of record.reasons) {
      if (!item || typeof item !== "object") continue;
      const entry = item as Partial<ReasonRecord>;
      const reason = cleanReason(entry.reason);
      if (!reason || !isScoreAction(entry.action) || !isStaffId(entry.staffId)) continue;
      if (entry.unitId !== "all" && !isUnitId(entry.unitId)) continue;
      if (typeof entry.at !== "number" || typeof entry.id !== "string" || entry.id.length === 0) continue;
      reasons.push({
        id: entry.id.slice(0, 80),
        at: entry.at,
        staffId: entry.staffId,
        unitId: entry.unitId,
        action: entry.action,
        reason,
      });
      if (reasons.length === REASON_ARCHIVE) break;
    }
    base.reasons = reasons;
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
  return [entry, ...(state.log ?? [])].slice(0, LOG_LIMIT);
}

function nextEntryId(now: number, staffId: StaffId) {
  return `${now.toString(36)}-${staffId}-${Math.random().toString(36).slice(2, 8)}`;
}

export function applyAction(
  state: ScoreState,
  action: ActionId,
  unitId: UnitId | undefined,
  staffId: StaffId,
  now = Date.now(),
): { state: ScoreState; events: MilestoneEvent[] } {
  const entry: ScoreLogEntry = {
    id: nextEntryId(now, staffId),
    action,
    unitId: action === "teamwork" || action === "reset" ? "all" : (unitId as UnitId),
    at: now,
    staffId,
    reason: null,
  };

  if (action === "reset") {
    return {
      state: { ...emptyScores(now), reasons: state.reasons ?? [], log: pushLog(state, entry) },
      events: [],
    };
  }

  if (action === "undo" || action === "adjust" || !isScoreAction(action)) {
    throw new Error("Use undoLastTick or adjustUnitScore for that action.");
  }

  if (action !== "teamwork" && !unitId) {
    throw new Error("A unit is required for this score.");
  }

  const before = { ...state.units };
  const next = { ...state.units };
  const crosses = { ...(state.crosses ?? { f1: 0, "234": 0, "56": 0 }) };

  if (action === "teamwork") {
    for (const id of UNIT_IDS) {
      next[id] = clampScore(next[id] + ACTION_COPY.teamwork.delta);
    }
  } else if (unitId && action === "strike") {
    if (next[unitId] > 0) {
      next[unitId] = clampScore(next[unitId] - 1);
      crosses[unitId] = clampStrike(crosses[unitId] + 1);
    }
  } else if (unitId) {
    next[unitId] = clampScore(next[unitId] + ACTION_COPY[action].delta);
  }

  const updated: ScoreState = {
    units: next,
    crosses,
    updatedAt: now,
    lastAction: {
      action,
      unitId: action === "teamwork" ? "all" : (unitId as UnitId),
      at: now,
      staffId,
    },
    log: pushLog(state, entry),
    reasons: state.reasons ?? [],
  };

  return {
    state: updated,
    events: milestonesBetween(before, next),
  };
}

export function attachReason(
  state: ScoreState,
  id: string,
  staffId: StaffId,
  reason: string,
  now = Date.now(),
): ScoreState {
  const clean = cleanReason(reason);
  if (!clean) throw new Error("Write a short reason.");
  const entry = (state.log ?? []).find((item) => item.id === id);
  if (!entry || entry.action === "reset" || !isScoreAction(entry.action)) {
    throw new Error("That tick is not on the board.");
  }
  if (entry.staffId !== staffId) {
    throw new Error("Only the teacher who gave the points can add the reason.");
  }
  if (now - entry.at > REASON_WINDOW_MS) {
    throw new Error("That tick is too old for a reason. The points stayed.");
  }
  const action = entry.action as ScoreAction;
  const log = state.log.map((item) => (item.id === id ? { ...item, reason: clean } : item));
  const record: ReasonRecord = {
    id: entry.id,
    at: entry.at,
    staffId,
    unitId: entry.unitId,
    action,
    reason: clean,
  };
  const reasons = [record, ...(state.reasons ?? []).filter((item) => item.id !== id)].slice(
    0,
    REASON_ARCHIVE,
  );
  return { ...state, log, reasons, updatedAt: now };
}

function reverseEntry(
  units: Record<UnitId, number>,
  crosses: Record<UnitId, number>,
  entry: ScoreLogEntry,
): { units: Record<UnitId, number>; crosses: Record<UnitId, number> } {
  const nextUnits = { ...units };
  const nextCrosses = { ...crosses };
  if (entry.action === "adjust" && isUnitId(entry.unitId)) {
    nextUnits[entry.unitId] = clampScore(nextUnits[entry.unitId] - (entry.delta ?? 0));
    return { units: nextUnits, crosses: nextCrosses };
  }
  if (entry.action === "teamwork") {
    for (const id of UNIT_IDS) {
      nextUnits[id] = clampScore(nextUnits[id] - ACTION_COPY.teamwork.delta);
    }
    return { units: nextUnits, crosses: nextCrosses };
  }
  if (!isUnitId(entry.unitId) || !isScoreAction(entry.action)) {
    return { units: nextUnits, crosses: nextCrosses };
  }
  if (entry.action === "strike") {
    if (nextCrosses[entry.unitId] > 0) {
      nextUnits[entry.unitId] = clampScore(nextUnits[entry.unitId] + 1);
      nextCrosses[entry.unitId] = clampStrike(nextCrosses[entry.unitId] - 1);
    }
    return { units: nextUnits, crosses: nextCrosses };
  }
  nextUnits[entry.unitId] = clampScore(nextUnits[entry.unitId] - ACTION_COPY[entry.action].delta);
  return { units: nextUnits, crosses: nextCrosses };
}

function lastActionFromLog(log: ScoreLogEntry[]): ScoreState["lastAction"] {
  const previous = log.find(
    (item) => isScoreAction(item.action) || (item.action === "adjust" && isUnitId(item.unitId)),
  );
  if (!previous) return null;
  if (previous.action === "adjust" && isUnitId(previous.unitId)) {
    // lastAction only stores score actions — map adjust to spot/strike for display.
    return {
      action: (previous.delta ?? 0) < 0 ? "strike" : "spot",
      unitId: previous.unitId,
      at: previous.at,
      staffId: previous.staffId,
    };
  }
  if (!isScoreAction(previous.action)) return null;
  return {
    action: previous.action,
    unitId: previous.unitId,
    at: previous.at,
    staffId: previous.staffId,
  };
}

/** Reverse the most recent non-reset tick and drop it from the log. */
export function undoLastTick(state: ScoreState, now = Date.now()): ScoreState {
  const log = state.log ?? [];
  const entry = log[0];
  if (!entry || entry.action === "reset" || entry.action === "undo") {
    throw new Error("Nothing to undo.");
  }
  if (!isScoreAction(entry.action) && entry.action !== "adjust") {
    throw new Error("Nothing to undo.");
  }
  return undoLogEntryById(state, entry.id, now);
}

/** Reverse any logged tick/adjust by id (for Edit points on the desk). */
export function undoLogEntryById(state: ScoreState, id: string, now = Date.now()): ScoreState {
  const trimmed = id.trim();
  if (!trimmed) throw new Error("Choose a tick to remove.");
  const log = state.log ?? [];
  const index = log.findIndex((item) => item.id === trimmed);
  if (index < 0) throw new Error("That tick is already gone.");
  const entry = log[index]!;
  if (entry.action === "reset" || entry.action === "undo") {
    throw new Error("That entry cannot be removed.");
  }
  if (!isScoreAction(entry.action) && entry.action !== "adjust") {
    throw new Error("That entry cannot be removed.");
  }

  const reversed = reverseEntry(
    state.units,
    state.crosses ?? { f1: 0, "234": 0, "56": 0 },
    entry,
  );
  const nextLog = log.filter((item) => item.id !== trimmed);
  return {
    units: reversed.units,
    crosses: reversed.crosses,
    updatedAt: now,
    lastAction: lastActionFromLog(nextLog),
    log: nextLog,
    reasons: (state.reasons ?? []).filter((item) => item.id !== entry.id),
  };
}

/** Manual tally edit — changes the class score without adding a strike mark. */
export function adjustUnitScore(
  state: ScoreState,
  unitId: UnitId,
  delta: number,
  staffId: StaffId,
  now = Date.now(),
): { state: ScoreState; events: MilestoneEvent[] } {
  if (delta !== 1 && delta !== -1) {
    throw new Error("Adjust by one point at a time.");
  }
  const before = state.units[unitId];
  const nextValue = clampScore(before + delta);
  if (nextValue === before) {
    if (delta < 0) throw new Error("That class is already at zero.");
    throw new Error("That class is already full.");
  }
  const units = { ...state.units, [unitId]: nextValue };
  const entry: ScoreLogEntry = {
    id: nextEntryId(now, staffId),
    action: "adjust",
    unitId,
    at: now,
    staffId,
    reason: "Manual edit",
    delta,
  };
  return {
    state: {
      units,
      crosses: state.crosses ?? { f1: 0, "234": 0, "56": 0 },
      updatedAt: now,
      lastAction: {
        action: delta < 0 ? "strike" : "spot",
        unitId,
        at: now,
        staffId,
      },
      log: pushLog(state, entry),
      reasons: state.reasons ?? [],
    },
    events: milestonesBetween({ ...state.units }, units),
  };
}
