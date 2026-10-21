import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { getOrchestrator } from "@/lib/browser/orchestrator";

// POST /api/browser/stop — stop the signed-in user's running browser.
// The profile (cookies/logins) stays on the host's disk; only the live
// container stops.

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!process.env.ORCHESTRATOR_URL) {
    return NextResponse.json({ error: "Browser host is not connected yet." }, { status: 503 });
  }

  const profile = await prisma.browserProfile.findFirst({ where: { ownerId: userId }, orderBy: { createdAt: "asc" } });
  if (!profile) return NextResponse.json({ ok: true, status: "stopped" });

  const orchestrator = getOrchestrator();
  const handle = await orchestrator.reconnect(profile.id).catch(() => null);
  if (handle) await orchestrator.stop(handle.sessionId).catch(() => undefined);

  await prisma.browserSession.updateMany({
    where: { profileId: profile.id, status: { in: ["STARTING", "RUNNING"] } },
    data: { status: "STOPPED", stoppedAt: new Date() }
  });
  await prisma.auditLog.create({ data: { actorId: userId, action: "browser.stop", targetType: "BrowserProfile", targetId: profile.id } });
  return NextResponse.json({ ok: true, status: "stopped" });
}
