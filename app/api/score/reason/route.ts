import { readBearer, verifyToken } from "@/lib/auth";
import { commitReason } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST(request: Request) {
  const staffId = verifyToken(readBearer(request));
  if (!staffId) return json({ error: "The yard desk is locked." }, 401);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "That reason could not be read." }, 400);
  }

  const id =
    payload && typeof payload === "object" && "id" in payload
      ? (payload as { id?: unknown }).id
      : undefined;
  const reason =
    payload && typeof payload === "object" && "reason" in payload
      ? (payload as { reason?: unknown }).reason
      : undefined;

  if (typeof id !== "string" || id.length === 0 || id.length > 80) {
    return json({ error: "That tick is not on the board." }, 400);
  }
  if (typeof reason !== "string") return json({ error: "Write a short reason." }, 400);

  try {
    const board = await commitReason(id, reason, staffId);
    return json(board);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The reason did not save.";
    const status = message === "The reason did not save." ? 500 : 400;
    return json({ error: message }, status);
  }
}
