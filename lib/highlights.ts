import { isStaffId, isUnitId, type StaffId, type UnitId } from "@/lib/game";
import { studentById } from "@/lib/students";

export const HIGHLIGHT_TTL_MS = 2 * 24 * 60 * 60 * 1000;
export const HIGHLIGHT_LIMIT = 12;

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
    const expiresAt =
      typeof row.expiresAt === "number" && Number.isFinite(row.expiresAt)
        ? row.expiresAt
        : row.at + HIGHLIGHT_TTL_MS;
    if (expiresAt <= now) continue;
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
    if (list.length === HIGHLIGHT_LIMIT) break;
  }
  return list.sort((left, right) => right.at - left.at);
}

export function activeHighlights(list: HighlightEntry[], now = Date.now()) {
  return list.filter((entry) => entry.expiresAt > now).sort((left, right) => left.at - right.at);
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
