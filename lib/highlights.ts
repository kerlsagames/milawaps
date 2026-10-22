import { isStaffId, isUnitId, type StaffId, type UnitId } from "@/lib/game";
import { studentById } from "@/lib/students";

/** Spotlights leave the TV after this long. */
export const HIGHLIGHT_TTL_MS = 24 * 60 * 60 * 1000;
/** How many spotlights stay in the durable store for download history. */
export const HIGHLIGHT_STORE_LIMIT = 250;
/** Max live spotlights the kiosk will cycle. */
export const HIGHLIGHT_LIMIT = 12;
/** Max students on one spotlight page. */
export const HIGHLIGHT_STUDENT_MAX = 3;
/** Teacher-chosen score value for a highlight (0 = spotlight only). */
export const HIGHLIGHT_POINT_MAX = 3;

export type HighlightStudent = {
  id: string;
  unitId: UnitId;
};

export type HighlightEntry = {
  id: string;
  at: number;
  expiresAt: number;
  staffId: StaffId;
  reason: string;
  students: HighlightStudent[];
  /** Class ticks awarded for this highlight (0–3). */
  points: number;
};

export function clampHighlightPoints(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(HIGHLIGHT_POINT_MAX, Math.round(value)));
}

/**
 * Unit ids to award (+1 spot each). When `points` is omitted, uses one tick per
 * student (legacy). Otherwise distributes the chosen total round-robin.
 */
export function highlightSpotUnits(students: HighlightStudent[], points?: number): UnitId[] {
  const n =
    points === undefined
      ? Math.min(HIGHLIGHT_POINT_MAX, students.length)
      : clampHighlightPoints(points);
  if (n === 0 || students.length === 0) return [];
  const units: UnitId[] = [];
  for (let i = 0; i < n; i++) {
    units.push(students[i % students.length]!.unitId);
  }
  return units;
}

export function highlightPointTotal(
  studentsOrEntry: HighlightStudent[] | Pick<HighlightEntry, "points" | "students">,
): number {
  if (Array.isArray(studentsOrEntry)) {
    return Math.min(HIGHLIGHT_POINT_MAX, studentsOrEntry.length);
  }
  if (typeof studentsOrEntry.points === "number") {
    return clampHighlightPoints(studentsOrEntry.points);
  }
  return Math.min(HIGHLIGHT_POINT_MAX, studentsOrEntry.students.length);
}

function text(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export function sanitizeHighlights(raw: unknown, now = Date.now()): HighlightEntry[] {
  if (!Array.isArray(raw)) return [];
  const list: HighlightEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<HighlightEntry>;
    if (!isStaffId(row.staffId) || typeof row.at !== "number") continue;
    const reason = text(row.reason, 140);
    if (!reason) continue;
    const studentsRaw = Array.isArray(row.students) ? row.students : [];
    const students = studentsRaw.slice(0, 12).flatMap((student) => {
      if (!student || typeof student !== "object") return [];
      const entry = student as Partial<HighlightStudent>;
      if (typeof entry.id !== "string" || !isUnitId(entry.unitId)) return [];
      const known = studentById(entry.id);
      if (!known || known.unitId !== entry.unitId) return [];
      return [{ id: known.id, unitId: known.unitId }];
    });
    if (students.length === 0) continue;
    // Always 24h from creation — shortens older longer rows and drops over-long countdowns.
    const expiresAt = row.at + HIGHLIGHT_TTL_MS;
    // Older rows had no points field — treat as +1 per student (old behaviour).
    const points =
      typeof row.points === "number"
        ? clampHighlightPoints(row.points)
        : Math.min(HIGHLIGHT_POINT_MAX, students.length);
    // Keep ended rows for spreadsheet download — TV uses activeHighlights().
    list.push({
      id:
        typeof row.id === "string" && row.id.length > 0 && row.id.length <= 80
          ? row.id
          : `highlight-${row.at}-${list.length}`,
      at: row.at,
      expiresAt,
      staffId: row.staffId,
      reason,
      students,
      points,
    });
    if (list.length >= HIGHLIGHT_STORE_LIMIT) break;
  }
  return list.sort((left, right) => right.at - left.at);
}

/** Live TV spotlights only — anything past 24h from creation is gone. */
export function activeHighlights(list: HighlightEntry[], now = Date.now()) {
  return list
    .filter((entry) => entry.at + HIGHLIGHT_TTL_MS > now && entry.expiresAt > now)
    .sort((left, right) => left.at - right.at)
    .slice(0, HIGHLIGHT_LIMIT);
}

export function createHighlight(
  students: HighlightStudent[],
  reason: string,
  staffId: StaffId,
  now = Date.now(),
  points?: number,
): HighlightEntry {
  const clean = text(reason, 140);
  if (!clean) throw new Error("Write why they shone.");
  if (students.length === 0) throw new Error("Pick at least one student.");
  const unique = new Map<string, HighlightStudent>();
  for (const student of students) {
    const known = studentById(student.id);
    if (!known || known.unitId !== student.unitId) {
      throw new Error("That student is not on the class list.");
    }
    unique.set(known.id, { id: known.id, unitId: known.unitId });
  }
  const picked = [...unique.values()].slice(0, HIGHLIGHT_STUDENT_MAX);
  const resolved =
    points === undefined
      ? Math.min(HIGHLIGHT_POINT_MAX, picked.length)
      : clampHighlightPoints(points);
  return {
    id: `${now.toString(36)}-${staffId}-${Math.random().toString(36).slice(2, 7)}`,
    at: now,
    expiresAt: now + HIGHLIGHT_TTL_MS,
    staffId,
    reason: clean,
    students: picked,
    points: resolved,
  };
}

export function highlightScreenId(id: string): `highlight:${string}` {
  return `highlight:${id}`;
}

export function parseHighlightScreen(id: string): string | null {
  if (!id.startsWith("highlight:")) return null;
  const value = id.slice("highlight:".length);
  return value || null;
}

/** Drop one highlight by id. Returns null if that id was not found. */
export function removeHighlightById(
  list: HighlightEntry[],
  id: string,
  now = Date.now(),
): HighlightEntry[] | null {
  const trimmed = id.trim();
  if (!trimmed) return null;
  const next = list.filter((entry) => entry.id !== trimmed);
  if (next.length === list.length) return null;
  return sanitizeHighlights(next, now);
}

export function formatHighlightCountdown(msLeft: number) {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
