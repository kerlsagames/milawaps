import { getExpectedAdminCode, pinsMatch, readBearer, signAdminToken, verifyAdminToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET(request: Request) {
  return json({ admin: verifyAdminToken(readBearer(request)) });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Send the admin code." }, 400);
  }
  const code =
    payload && typeof payload === "object" && "code" in payload
      ? (payload as { code?: unknown }).code
      : undefined;
  if (typeof code !== "string" || !/^\d{4}$/.test(code) || !pinsMatch(code, getExpectedAdminCode())) {
    return json({ error: "That code is not the admin code." }, 401);
  }
  const signed = signAdminToken();
  return json(signed);
}
