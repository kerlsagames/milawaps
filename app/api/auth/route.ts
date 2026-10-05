import { getExpectedPin, pinsMatch, signToken } from "@/lib/auth";
import { readSecurity, writeSecurity } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FAILS = 5;
const LOCK_MS = 60_000;

function json(body: unknown, status = 200, extraHeaders?: HeadersInit) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      ...Object.fromEntries(new Headers(extraHeaders).entries()),
    },
  });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Send the six-digit PIN." }, 400);
  }

  const pin =
    payload && typeof payload === "object" && "pin" in payload
      ? (payload as { pin?: unknown }).pin
      : undefined;

  if (typeof pin !== "string" || !/^\d{6}$/.test(pin)) {
    return json({ error: "The PIN is six digits." }, 400);
  }

  const expected = getExpectedPin();
  if (!expected) {
    return json(
      { error: "STAFF_PIN must be six digits." },
      500,
    );
  }

  const security = await readSecurity();
  const now = Date.now();
  if (security.lockedUntil > now) {
    const retryAfter = Math.ceil((security.lockedUntil - now) / 1000);
    return json(
      { error: "Too many tries. The pad is resting.", retryAfter },
      429,
      { "Retry-After": String(retryAfter) },
    );
  }

  if (!pinsMatch(pin, expected)) {
    const fails = security.fails + 1;
    const locked = fails >= MAX_FAILS;
    await writeSecurity({
      fails: locked ? 0 : fails,
      lockedUntil: locked ? now + LOCK_MS : 0,
    });
    return json(
      {
        error: locked
          ? "Too many tries. The pad is resting."
          : "That PIN does not open the yard desk.",
        retryAfter: locked ? Math.ceil(LOCK_MS / 1000) : undefined,
      },
      locked ? 429 : 401,
    );
  }

  await writeSecurity({ fails: 0, lockedUntil: 0 });
  return json(signToken(now));
}
