import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { getOrchestratorFor } from "@/lib/browser/orchestrator";
import { resolveOrchestratorBase } from "@/lib/browser/host-endpoint";

// POST /api/browser/stop — stop the signed-in user's running browser.
// The profile (cookies/logins) stays on the host's disk; only the live
// container stops.

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  // Same dynamic base resolution as launch/status: fresh heartbeat first,
  // env var fallback.
  const base = await resolveOrchestratorBase();
  if (!base) {
    return NextResponse.json({ error: "Browser host is not connected yet." }, { status: 503 });
  }

  const profile = await prisma.browserProfile.findFirst({ where: { ownerId: userId }, orderBy: { createdAt: "asc" } });
  if (!profile) return NextResponse.json({ ok: true, status: "stopped" });

  const orchestrator = getOrchestratorFor(base);
  const handle = await orchestrator.reconnect(profile.id).catch(() => null);
  if (handle) await orchestrator.stop(handle.sessionId).catch(() => undefined);

  await prisma.browserSession.updateMany({
    where: { profileId: profile.id, status: { in: ["STARTING", "RUNNING"] } },
    data: { status: "STOPPED", stoppedAt: new Date() }
  });
  await prisma.auditLog.create({ data: { actorId: userId, action: "browser.stop", targetType: "BrowserProfile", targetId: profile.id } });
  return NextResponse.json({ ok: true, status: "stopped" });
}
