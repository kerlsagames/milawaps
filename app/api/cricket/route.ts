import { PREVIEW_CRICKET, parseCricketSnapshot, shareUrlForCode } from "@/lib/cricket";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim() ?? "";
  if (!code) return json({ error: "Add a cricket code in Settings." }, 400);
  if (code.toLowerCase() === "preview") return json(PREVIEW_CRICKET);

  const url = shareUrlForCode(code);
  if (!url) {
    return json(
      {
        error: code.startsWith("https://")
          ? "That share link cannot be used."
          : "Use the short code from Jimmy’s cricket, such as BQWA8Z.",
      },
      400,
    );
  }

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok) {
      return json({ error: "Jimmy’s cricket did not recognise that code." }, 404);
    }
    const body = (await response.json()) as unknown;
    const snapshot = parseCricketSnapshot(body);
    if (!snapshot) {
      return json({ error: "That code did not include a ladder or a draw." }, 422);
    }
    return json(snapshot);
  } catch {
    return json({ error: "The cricket board is out of reach." }, 502);
  }
}
