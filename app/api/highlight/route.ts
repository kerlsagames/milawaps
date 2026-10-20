import { readBearer, verifyToken } from "@/lib/auth";
import { isUnitId, type UnitId } from "@/lib/game";
import { commitHighlight, readBoard } from "@/lib/store";
import type { HighlightStudent } from "@/lib/highlights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET() {
  try {
    const board = await readBoard();
    return json({ highlights: board.highlights });
  } catch {
    return json({ error: "The highlight board is out of reach." }, 500);
  }
}

export async function POST(request: Request) {
  const staffId = verifyToken(readBearer(request));
  if (!staffId) {
    return json({ error: "The yard desk is locked." }, 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "That highlight could not be read." }, 400);
  }

  const reason =
    payload && typeof payload === "object" && "reason" in payload
      ? (payload as { reason?: unknown }).reason
      : undefined;
  const studentsRaw =
    payload && typeof payload === "object" && "students" in payload
      ? (payload as { students?: unknown }).students
      : undefined;

  if (typeof reason !== "string") {
    return json({ error: "Write why they shone." }, 400);
  }
  if (!Array.isArray(studentsRaw) || studentsRaw.length === 0) {
    return json({ error: "Pick at least one student." }, 400);
  }

  const students: HighlightStudent[] = [];
  for (const item of studentsRaw) {
    if (!item || typeof item !== "object") continue;
    const row = item as { id?: unknown; unitId?: unknown };
    if (typeof row.id !== "string" || !isUnitId(row.unitId)) continue;
    students.push({ id: row.id, unitId: row.unitId as UnitId });
  }
  if (students.length === 0) {
    return json({ error: "Pick at least one student." }, 400);
  }

  try {
    const board = await commitHighlight(students, reason, staffId);
    return json(board);
  } catch (error) {
    const message = error instanceof Error ? error.message : "That highlight did not save.";
    const status = message.includes("Upstash Redis") ? 503 : 400;
    return json({ error: message }, status);
  }
}
