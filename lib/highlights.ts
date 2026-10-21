import { isStaffId, isUnitId, type StaffId, type UnitId } from "@/lib/game";
import { studentById } from "@/lib/students";

/** Spotlights leave the TV after this long. */
export const HIGHLIGHT_TTL_MS = 25 * 60 * 60 * 1000;
/** How many spotlights stay in the durable store for download history. */
export const HIGHLIGHT_STORE_LIMIT = 250;
/** Max live spotlights the kiosk will cycle. */
export const HIGHLIGHT_LIMIT = 12;
/** One class tick per student in a highlight, capped so a big group stays fair. */
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
};

/** Unit ids to award (+1 each), one per student, max HIGHLIGHT_POINT_MAX. */
export function highlightSpotUnits(students: HighlightStudent[]): UnitId[] {
  return students.slice(0, HIGHLIGHT_POINT_MAX).map((student) => student.unitId);
}

export function highlightPointTotal(students: HighlightStudent[]): number {
  return Math.min(HIGHLIGHT_POINT_MAX, students.length);
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
    // Cap at TTL from creation so older longer rows adopt the current default.
    const rawExpires =
      typeof row.expiresAt === "number" && Number.isFinite(row.expiresAt)
        ? row.expiresAt
        : row.at + HIGHLIGHT_TTL_MS;
    const expiresAt = Math.min(rawExpires, row.at + HIGHLIGHT_TTL_MS);
    // Keep expired rows for spreadsheet download — TV uses activeHighlights().
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
    });
    if (list.length >= HIGHLIGHT_STORE_LIMIT) break;
  }
  return list.sort((left, right) => right.at - left.at);
}

export function activeHighlights(list: HighlightEntry[], now = Date.now()) {
  return list
    .filter((entry) => entry.expiresAt > now)
    .sort((left, right) => left.at - right.at)
    .slice(0, HIGHLIGHT_LIMIT);
}

export function createHighlight(
  students: HighlightStudent[],
  reason: string,
  staffId: StaffId,
  now = Date.now(),
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
  return {
    id: `${now.toString(36)}-${staffId}-${Math.random().toString(36).slice(2, 7)}`,
    at: now,
    expiresAt: now + HIGHLIGHT_TTL_MS,
    staffId,
    reason: clean,
    students: [...unique.values()],
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
