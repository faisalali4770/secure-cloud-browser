import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { getOrchestrator } from "@/lib/browser/orchestrator";

// GET /api/browser/status — is the browser host connected, and is a browser
// running for the signed-in user? Honest states only: when no orchestrator
// is configured this says so (configured: false) instead of pretending.

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const base = process.env.ORCHESTRATOR_URL;
  if (!base) {
    return NextResponse.json({ configured: false, hostOnline: false, running: false });
  }

  let hostOnline = false;
  let dockerReady = false;
  try {
    const res = await fetch(`${base}/health`, {
      headers: { authorization: `Bearer ${process.env.ORCHESTRATOR_INTERNAL_TOKEN || ""}` },
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const health = await res.json();
      hostOnline = true;
      dockerReady = !!health.docker;
    }
  } catch {
    hostOnline = false;
  }

  let running = false;
  if (hostOnline && dockerReady) {
    const profile = await prisma.browserProfile.findFirst({ where: { ownerId: userId }, orderBy: { createdAt: "asc" } });
    if (profile) {
      const handle = await getOrchestrator().reconnect(profile.id).catch(() => null);
      running = !!handle;
    }
  }

  return NextResponse.json({ configured: true, hostOnline, dockerReady, running });
}
