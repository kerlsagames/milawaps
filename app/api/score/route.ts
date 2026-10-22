import { readBearer, verifyToken } from "@/lib/auth";
import { isActionId, isUnitId, type UnitId } from "@/lib/game";
import { commitAction, readBoard } from "@/lib/store";

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
    return json(board);
  } catch {
    return json({ error: "The yard board is out of reach." }, 500);
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
    return json({ error: "That score could not be read." }, 400);
  }

  const action =
    payload && typeof payload === "object" && "action" in payload
      ? (payload as { action?: unknown }).action
      : undefined;
  const unitValue =
    payload && typeof payload === "object" && "unitId" in payload
      ? (payload as { unitId?: unknown }).unitId
      : undefined;
  const logId =
    payload && typeof payload === "object" && "logId" in payload
      ? (payload as { logId?: unknown }).logId
      : undefined;
  const deltaRaw =
    payload && typeof payload === "object" && "delta" in payload
      ? (payload as { delta?: unknown }).delta
      : undefined;

  if (!isActionId(action)) {
    return json({ error: "Unknown scoring action." }, 400);
  }

  // Full board clear is admin-only (Settings → Reset). Teachers use undo for mistakes.
  if (action === "reset") {
    return json(
      { error: "Only an admin can clear the board. Use Settings with the admin code." },
      403,
    );
  }

  let unitId: UnitId | undefined;
  if (action === "teamwork" || action === "undo") {
    unitId = undefined;
  } else if (!isUnitId(unitValue)) {
    return json({ error: "Choose F/1, 2/3/4, or 5/6." }, 400);
  } else {
    unitId = unitValue;
  }

  const options: { logId?: string; delta?: number } = {};
  if (action === "undo" && typeof logId === "string" && logId.trim()) {
    options.logId = logId.trim();
  }
  if (action === "adjust") {
    if (deltaRaw !== 1 && deltaRaw !== -1) {
      return json({ error: "Adjust by one point at a time." }, 400);
    }
    options.delta = deltaRaw;
  }

  try {
    const result = await commitAction(action, unitId, staffId, options);
    return json({ ...result.board, events: result.events });
  } catch (error) {
    if ((action === "undo" || action === "adjust") && error instanceof Error) {
      return json({ error: error.message }, 400);
    }
    const message =
      error instanceof Error ? error.message : "The score did not save. Try the tick again.";
    const status =
      message.includes("durable store") || message.includes("Upstash Redis") ? 503 : 500;
    return json({ error: message }, status);
  }
}
