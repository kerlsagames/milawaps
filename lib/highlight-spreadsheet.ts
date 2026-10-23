import * as XLSX from "xlsx";
import { UNITS, kidName, type UnitId } from "@/lib/game";
import type { HighlightEntry } from "@/lib/highlights";
import { studentById, studentsForUnit } from "@/lib/students";

/**
 * Excel sheet / class labels — avoid "/" so Excel does not treat "2/3/4" as a date.
 * Sheet names also cannot contain "/".
 */
export function gradeSheetName(unitId: UnitId): string {
  if (unitId === "f1") return "F-1";
  if (unitId === "234") return "2-3-4";
  return "5-6";
}

export function classLabel(unitId: UnitId): string {
  return gradeSheetName(unitId);
}

function melbourneStamp(at: number) {
  // ISO-ish stamp so Excel does not auto-convert day/month slashes into dates.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(at)
    .replace(",", "");
}

/** How many stored shout-outs each student appears in (full history, not just today). */
export function shoutOutCounts(entries: HighlightEntry[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const student of entry.students) {
      counts.set(student.id, (counts.get(student.id) ?? 0) + 1);
    }
  }
  return counts;
}

/** One spreadsheet row per student in each stored shout-out (live + ended history). */
export function spotlightExportRows(entries: HighlightEntry[], now = Date.now()) {
  const header = ["When", "Staff", "Student", "Class", "Reason", "Expires", "Status"] as const;
  const rows: string[][] = [];
  const sorted = [...entries].sort((left, right) => right.at - left.at);
  for (const entry of sorted) {
    for (const student of entry.students) {
      const known = studentById(student.id);
      if (!known) continue;
      rows.push([
        melbourneStamp(entry.at),
        kidName(entry.staffId),
        known.name,
        classLabel(known.unitId),
        entry.reason,
        melbourneStamp(entry.expiresAt),
        entry.expiresAt > now ? "Live" : "Ended",
      ]);
    }
  }
  return { header: [...header], rows };
}

export function buildHighlightWorkbook(entries: HighlightEntry[], now = Date.now()) {
  const wb = XLSX.utils.book_new();
  const { header, rows } = spotlightExportRows(entries, now);
  const spotData = [header, ...rows];
  if (rows.length === 0) {
    spotData.push(["(no shout-outs saved yet)", "", "", "", "", "", ""]);
  }
  const spotSheet = XLSX.utils.aoa_to_sheet(spotData);
  // Force Class column to text so Excel never turns "2-3-4" / old "2/3/4" into a date.
  for (let row = 1; row < spotData.length; row += 1) {
    const address = XLSX.utils.encode_cell({ r: row, c: 3 });
    const cell = spotSheet[address];
    if (!cell) continue;
    cell.t = "s";
    cell.v = String(cell.v ?? "");
    cell.z = "@";
  }
  XLSX.utils.book_append_sheet(wb, spotSheet, "All shout-outs");

  const counts = shoutOutCounts(entries);
  for (const unit of UNITS) {
    const gradeData: (string | number)[][] = [["Student", "Shout-outs"]];
    for (const student of studentsForUnit(unit.id)) {
      gradeData.push([student.name, counts.get(student.id) ?? 0]);
    }
    const gradeSheet = XLSX.utils.aoa_to_sheet(gradeData);
    XLSX.utils.book_append_sheet(wb, gradeSheet, gradeSheetName(unit.id));
  }

  return wb;
}

/** Normalize SheetJS write output (ArrayBuffer / Uint8Array / number[]) to bytes. */
function asWorkbookBytes(raw: ArrayBuffer | Uint8Array | number[]): Uint8Array {
  if (raw instanceof Uint8Array) return raw;
  if (raw instanceof ArrayBuffer) return new Uint8Array(raw);
  return Uint8Array.from(raw);
}

/** Browser-ready .xlsx bytes covering every stored shout-out plus per-grade tallies. */
export function highlightsWorkbookBytes(entries: HighlightEntry[], now = Date.now()): Uint8Array {
  const workbook = buildHighlightWorkbook(entries, now);
  // SheetJS 0.18 often returns ArrayBuffer for type:"array" — not a Uint8Array.
  // Callers must wrap with `new Uint8Array(buffer)`, not `new Uint8Array(buffer.byteLength)`.
  return asWorkbookBytes(XLSX.write(workbook, { bookType: "xlsx", type: "array" }));
}

function csvEscape(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** Plain CSV of every stored shout-out (tests / fallback). Prefer .xlsx for Excel. */
export function highlightsToCsv(entries: HighlightEntry[], now = Date.now()): string {
  const { header, rows } = spotlightExportRows(entries, now);
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(","));
  }
  return `${lines.join("\n")}\n`;
}
