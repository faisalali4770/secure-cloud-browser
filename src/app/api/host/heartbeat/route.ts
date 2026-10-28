import { NextResponse } from "next/server";
import { recordHostHeartbeat } from "@/lib/browser/host-endpoint";

// POST /api/host/heartbeat { url } — the PC host agent reports its current
// tunnel URL so the app can reach the orchestrator even though the free
// tunnel URL changes on every host restart.
//
// Auth is the shared internal token in the `x-internal-token` header (the
// PC agent is not a signed-in user, so there is deliberately no session
// check). Only https://*.trycloudflare.com URLs are accepted — the host is
// only ever reached through its Cloudflare quick tunnel.
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
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".trycloudflare.com")) {
    return NextResponse.json({ error: "url must be an https://*.trycloudflare.com URL." }, { status: 400 });
  }

  await recordHostHeartbeat(url);
  return NextResponse.json({ ok: true });
}
