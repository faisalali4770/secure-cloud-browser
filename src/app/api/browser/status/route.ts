import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { getOrchestratorFor } from "@/lib/browser/orchestrator";
import { resolveOrchestratorBase } from "@/lib/browser/host-endpoint";

// GET /api/browser/status — is the browser host connected, and is a browser
// running for the signed-in user? Honest states only: when no orchestrator
// is configured this says so (configured: false) instead of pretending.

// The host is reached through a free tunnel whose first hit can be slow or
// stall, so the health check uses a generous timeout and one retry — a
// single slow response must not brand a healthy host "offline" (this exact
// failure happened on 2026-10-23: the gate answered curl in ~0.5s while
// this check kept timing out at 5s and the panel showed "host offline").
async function fetchHealth(base: string): Promise<{ hostOnline: boolean; dockerReady: boolean }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${base}/health`, {
        headers: { authorization: `Bearer ${process.env.ORCHESTRATOR_INTERNAL_TOKEN || ""}` },
        signal: AbortSignal.timeout(12000)
      });
      if (res.ok) {
        const health = await res.json();
        return { hostOnline: true, dockerReady: !!health.docker };
      }
    } catch {
      // network error, timeout, or a non-JSON answer — retry once below
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
  }
  return { hostOnline: false, dockerReady: false };
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // The host's tunnel URL changes on every restart: prefer a fresh
  // heartbeated URL, fall back to the ORCHESTRATOR_URL env var.
  const base = await resolveOrchestratorBase();
  if (!base) {
    return NextResponse.json({ configured: false, hostOnline: false, running: false });
  }

  const { hostOnline, dockerReady } = await fetchHealth(base);

  let running = false;
  if (hostOnline && dockerReady) {
    const profile = await prisma.browserProfile.findFirst({ where: { ownerId: userId }, orderBy: { createdAt: "asc" } });
    if (profile) {
      const handle = await getOrchestratorFor(base).reconnect(profile.id).catch(() => null);
      running = !!handle;
    }
  }

  return NextResponse.json({ configured: true, hostOnline, dockerReady, running });
}
