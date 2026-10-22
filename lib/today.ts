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
import { highlightPointTotal, type HighlightEntry } from "@/lib/highlights";
import { milestonesBetween } from "@/lib/scoring";
import { studentById } from "@/lib/students";
import { melbourneDateKey } from "@/lib/ticker";

export type TodayKind = "tick" | "strike" | "unlock" | "highlight";

export type TodayItem = {
  id: string;
  at: number;
  kind: TodayKind;
  text: string;
  /** Points this row awarded (highlights: +1 per student, max 3). */
  points?: number;
};

/** Sidebar, kiosk, and desk tab all show the same rolling window. */
const TODAY_LIMIT = 10;
const TODAY_PAGE_LIMIT = 10;

function pointPhrase(delta: number) {
  const amount = Math.abs(delta);
  const word = amount === 1 ? "point" : "points";
  return `${delta < 0 ? "−" : "+"}${amount} ${word}`;
}

function columnLine(entry: ScoreLogEntry): string | null {
  const who = kidName(entry.staffId);
  if (entry.action === "adjust" && isUnitId(entry.unitId)) {
    const phrase = pointPhrase(entry.delta ?? 0);
    return `${who} · ${unitById(entry.unitId).code} ${phrase} · manual edit`;
  }
  if (!isScoreAction(entry.action)) return null;
  const phrase = pointPhrase(ACTION_COPY[entry.action].delta);
  const where = entry.unitId === "all" ? "all classes" : unitById(entry.unitId).code;
  const reason = entry.reason?.trim();
  const base = `${who} · ${where} ${phrase}`;
  return reason ? `${base} · ${reason}` : base;
}

function nameList(entry: HighlightEntry): string {
  const names = entry.students
    .map((student) => studentById(student.id)?.name)
    .filter((name): name is string => Boolean(name));
  if (names.length === 0) return "students";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

function highlightPoints(entry: HighlightEntry): number {
  return Math.max(1, highlightPointTotal(entry.students));
}

function highlightLine(entry: HighlightEntry): string {
  const who = kidName(entry.staffId);
  const names = nameList(entry);
  const reason = entry.reason.trim();
  const base = `${who} · highlighted ${names}`;
  return reason ? `${base} · ${reason}` : base;
}

/** Spot ticks created with a highlight — the feed only needs the highlight line. */
function isHighlightCompanionSpot(entry: ScoreLogEntry, highlights: HighlightEntry[]): boolean {
  if (entry.action !== "spot" || !isUnitId(entry.unitId)) return false;
  const reason = entry.reason?.trim() ?? "";
  for (const highlight of highlights) {
    if (highlight.staffId !== entry.staffId) continue;
    const inClass = highlight.students.some((student) => student.unitId === entry.unitId);
    if (!inClass) continue;
    const highlightReason = highlight.reason.trim();
    if (reason && highlightReason && reason === highlightReason) return true;
    // Same teacher, class, and moment (highlight save awards the +1 in the same second).
    if (Math.abs(entry.at - highlight.at) <= 3_000) return true;
  }
  return false;
}

function undoAction(
  after: Record<UnitId, number>,
  crosses: Record<UnitId, number>,
  entry: ScoreLogEntry,
): { units: Record<UnitId, number>; crosses: Record<UnitId, number> } | null {
  if (entry.action === "reset") return null;
  const units = { ...after };
  const nextCrosses = { ...crosses };
  if (entry.action === "adjust" && isUnitId(entry.unitId)) {
    units[entry.unitId] = clampScore(units[entry.unitId] - (entry.delta ?? 0));
    return { units, crosses: nextCrosses };
  }
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

/** Melbourne calendar day before `now` (YYYY-MM-DD). */
export function melbourneYesterdayKey(now: number) {
  const [year, month, day] = melbourneDateKey(now).split("-").map(Number);
  const previous = new Date(Date.UTC(year!, month! - 1, day!));
  previous.setUTCDate(previous.getUTCDate() - 1);
  const y = previous.getUTCFullYear();
  const m = String(previous.getUTCMonth() + 1).padStart(2, "0");
  const d = String(previous.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Time for feed rows; include the day when the event is not from today. */
export function feedEventStamp(at: number, now = Date.now()) {
  const time = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    hour: "numeric",
    minute: "2-digit",
  }).format(at);
  const dayKey = melbourneDateKey(at);
  const todayKey = melbourneDateKey(now);
  if (dayKey === todayKey) return time;
  if (dayKey === melbourneYesterdayKey(now)) return `Yesterday ${time}`;
  const weekday = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    weekday: "short",
  }).format(at);
  return `${weekday} ${time}`;
}

/**
 * Latest feed: most recent ticks / strikes / unlocks / highlights across days.
 * Caps at `limit` so a new event bumps the oldest row off.
 */
export function todayFeed(
  board: Pick<PublicBoard, "units" | "crosses" | "log"> &
    Partial<Pick<PublicBoard, "highlights">>,
  now = Date.now(),
  prizeName: (points: number, title: string) => string = (_points, title) => title,
  limit = TODAY_LIMIT,
): TodayItem[] {
  let units = { ...board.units };
  let crosses: Record<UnitId, number> = {
    f1: board.crosses?.f1 ?? 0,
    "234": board.crosses?.["234"] ?? 0,
    "56": board.crosses?.["56"] ?? 0,
  };
  const items: TodayItem[] = [];
  // Include ended spotlights too — they still belong in the rolling feed history.
  const feedHighlights = [...(board.highlights ?? [])];

  for (const entry of board.log ?? []) {
    if (entry.action === "reset") break;
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
    // Highlight already covers the story — skip the companion +1 tick line.
    if (!isHighlightCompanionSpot(entry, feedHighlights)) {
      const line = columnLine(entry);
      if (line) {
        const kind =
          entry.action === "strike" || (entry.action === "adjust" && (entry.delta ?? 0) < 0)
            ? "strike"
            : "tick";
        items.push({
          id: entry.id,
          at: entry.at,
          kind,
          text: line,
        });
      }
    }
    units = undone.units;
    crosses = undone.crosses;
  }

  for (const entry of feedHighlights) {
    items.push({
      id: `highlight:${entry.id}`,
      at: entry.at,
      kind: "highlight",
      text: highlightLine(entry),
      points: highlightPoints(entry),
    });
  }

  const kindRank: Record<TodayKind, number> = {
    unlock: 0,
    highlight: 1,
    tick: 2,
    strike: 3,
  };
  return items
    .sort((left, right) => {
      if (right.at !== left.at) return right.at - left.at;
      const rank = kindRank[left.kind] - kindRank[right.kind];
      if (rank !== 0) return rank;
      return left.id.localeCompare(right.id);
    })
    .slice(0, Math.max(1, limit));
}

export { TODAY_LIMIT, TODAY_PAGE_LIMIT };
