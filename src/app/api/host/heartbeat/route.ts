import { NextResponse } from "next/server";
import { recordHostHeartbeat } from "@/lib/browser/host-endpoint";

// POST /api/host/heartbeat { url } — the PC host agent reports its current
// tunnel URL so the app can reach the orchestrator even though the free
// tunnel URL changes on every host restart.
//
// Auth is the shared internal token in the `x-internal-token` header (the
// PC agent is not a signed-in user, so there is deliberately no session
// check). Only tunnel URLs of the two transports the PC agent uses are
// accepted: https://*.trycloudflare.com (Cloudflare quick tunnel) and
// https://*.ts.net (Tailscale Funnel — a stable address that does not
// bot-block cloud clients the way the free Cloudflare tunnel does).
export async function POST(req: Request) {
  const expected = process.env.ORCHESTRATOR_INTERNAL_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: "Internal token is not configured on the server." }, { status: 500 });
  }
  if (req.headers.get("x-internal-token") !== expected) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const url = (body as { url?: unknown } | null)?.url;
  if (typeof url !== "string" || url.length === 0) {
    return NextResponse.json({ error: "Body must be JSON with a url string." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "url is not a valid URL." }, { status: 400 });
  }
  const host = parsed.hostname;
  const allowedHost = host.endsWith(".trycloudflare.com") || host.endsWith(".ts.net");
  if (parsed.protocol !== "https:" || !allowedHost) {
    return NextResponse.json({ error: "url must be an https://*.trycloudflare.com or https://*.ts.net URL." }, { status: 400 });
  }

  await recordHostHeartbeat(url);
  return NextResponse.json({ ok: true });
}
