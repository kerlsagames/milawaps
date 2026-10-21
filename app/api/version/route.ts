export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Build identity so kiosk TVs can reload when a new deploy lands. */
export async function GET() {
  const buildId =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_DEPLOYMENT_ID ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    "dev";

  return Response.json(
    { buildId },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
