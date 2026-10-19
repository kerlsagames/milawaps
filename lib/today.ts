import {
  ACTION_COPY,
  UNIT_IDS,
  isScoreAction,
  isUnitId,
  kidName,
  unitById,
  type PublicBoard,
  type ScoreLogEntry,
  type UnitId,
  clampScore,
} from "@/lib/game";
import { milestonesBetween } from "@/lib/scoring";
import { melbourneDateKey } from "@/lib/ticker";

export type TodayKind = "tick" | "strike" | "unlock";

export type TodayItem = {
  id: string;
  at: number;
  kind: TodayKind;
  text: string;
};

const TODAY_LIMIT = 8;

function pointPhrase(delta: number) {
  const amount = Math.abs(delta);
  const word = amount === 1 ? "point" : "points";
  return `${delta < 0 ? "−" : "+"}${amount} ${word}`;
}

function columnLine(entry: ScoreLogEntry): string | null {
  if (!isScoreAction(entry.action)) return null;
  const who = kidName(entry.staffId);
  const phrase = pointPhrase(ACTION_COPY[entry.action].delta);
  const where = entry.unitId === "all" ? "all classes" : unitById(entry.unitId).code;
  const reason = entry.reason?.trim();
  const base = `${who} · ${where} ${phrase}`;
  return reason ? `${base} · ${reason}` : base;
}

function undoAction(
  after: Record<UnitId, number>,
  crosses: Record<UnitId, number>,
  entry: ScoreLogEntry,
): { units: Record<UnitId, number>; crosses: Record<UnitId, number> } | null {
  if (entry.action === "reset") return null;
  const units = { ...after };
  const nextCrosses = { ...crosses };
  if (entry.action === "teamwork") {
    for (const id of UNIT_IDS) {
      units[id] = clampScore(units[id] - ACTION_COPY.teamwork.delta);
    }
    return { units, crosses: nextCrosses };
  }
  if (!isUnitId(entry.unitId) || !isScoreAction(entry.action)) {
    return { units, crosses: nextCrosses };
  }
  if (entry.action === "strike") {
    if (nextCrosses[entry.unitId] > 0) {
      units[entry.unitId] = clampScore(units[entry.unitId] + 1);
      nextCrosses[entry.unitId] -= 1;
    }
    return { units, crosses: nextCrosses };
  }
  units[entry.unitId] = clampScore(units[entry.unitId] - ACTION_COPY[entry.action].delta);
  return { units, crosses: nextCrosses };
}

export function todayFeed(
  board: Pick<PublicBoard, "units" | "crosses" | "log">,
  now = Date.now(),
  prizeName: (points: number, title: string) => string = (_points, title) => title,
): TodayItem[] {
  const today = melbourneDateKey(now);
  let units = { ...board.units };
  let crosses: Record<UnitId, number> = {
    f1: board.crosses?.f1 ?? 0,
    "234": board.crosses?.["234"] ?? 0,
    "56": board.crosses?.["56"] ?? 0,
  };
  const items: TodayItem[] = [];

  for (const entry of board.log ?? []) {
    if (entry.action === "reset") break;
    if (melbourneDateKey(entry.at) !== today) break;
    const undone = undoAction(units, crosses, entry);
    if (!undone) break;
    const unlocks = milestonesBetween(undone.units, units).reverse();
    for (const event of unlocks) {
      if (event.scope !== "unit" || !event.unitId) continue;
      items.push({
        id: `${entry.id}:${event.unitId}:${event.points}`,
        at: entry.at,
        kind: "unlock",
        text: `${unitById(event.unitId).code} unlocked ${prizeName(event.points, event.title)}`,
      });
    }
    const line = columnLine(entry);
    if (line) {
      items.push({
        id: entry.id,
        at: entry.at,
        kind: entry.action === "strike" ? "strike" : "tick",
        text: line,
      });
    }
    units = undone.units;
    crosses = undone.crosses;
    if (items.length >= TODAY_LIMIT) break;
  }

  return items.slice(0, TODAY_LIMIT);
}
