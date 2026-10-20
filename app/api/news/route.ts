import { readBearer, verifyAdminToken } from "@/lib/auth";
import { commitNews, readBoard } from "@/lib/store";

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
    return json(board.news);
  } catch {
    return json({ error: "The news desk is out of reach." }, 500);
  }
}

export async function POST(request: Request) {
  if (!verifyAdminToken(readBearer(request))) {
    return json({ error: "Admin only. Unlock Settings with the admin code." }, 401);
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "That news page could not be read." }, 400);
  }
  try {
    const board = await commitNews(payload);
    return json(board);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The news page did not save.";
    const status = message.includes("Upstash Redis") ? 503 : 500;
    return json({ error: message }, status);
  }
}
