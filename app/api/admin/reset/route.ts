import { readBearer, verifyAdminToken } from "@/lib/auth";
import { commitAction } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST(request: Request) {
  if (!verifyAdminToken(readBearer(request))) {
    return json({ error: "Only the admin can reset the board." }, 401);
  }
  try {
    const result = await commitAction("reset", undefined, "craig");
    return json(result.board);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The scores did not reset.";
    const status = message.includes("Upstash Redis") ? 503 : 500;
    return json({ error: message }, status);
  }
}
