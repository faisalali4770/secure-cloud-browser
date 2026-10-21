import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { getOrchestrator, BROWSER_LIMITS } from "@/lib/browser/orchestrator";

// POST /api/browser/launch — start (or reconnect to) the signed-in user's
// cloud browser and return a one-time stream URL (raw token in the path,
// <= 5 minutes, single-use; only its hash is ever stored).
//
// The browser itself runs in a container on the user's Docker host via the
// orchestrator service. If no host is configured/reachable this returns an
// honest error — it never fakes a browser.

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  if (!process.env.ORCHESTRATOR_URL) {
    return NextResponse.json(
      { error: "Browser host is not connected yet. Start the host on your PC first — then this button will work." },
      { status: 503 }
    );
  }
  const orchestrator = getOrchestrator();

  // One profile per user for now (limit BROWSER_LIMITS.maxProfilesPerUser).
  let profile = await prisma.browserProfile.findFirst({ where: { ownerId: userId }, orderBy: { createdAt: "asc" } });
  if (!profile) {
    profile = await prisma.browserProfile.create({
      data: { ownerId: userId, name: "My Browser", storageKey: `u-${userId}` }
    });
  }

  try {
    // Already running? Reconnect instead of launching a second container.
    let handle = await orchestrator.reconnect(profile.id).catch(() => null);
    if (!handle) {
      const session = await prisma.browserSession.create({
        data: { profileId: profile.id, startedById: userId, status: "STARTING" }
      });
      try {
        handle = await orchestrator.launch({
          profileId: profile.id,
          storageKey: profile.storageKey,
          timezone: profile.timezone,
          locale: profile.locale,
          viewportWidth: profile.viewportWidth,
          viewportHeight: profile.viewportHeight,
          viewOnly: false
        });
      } catch (e) {
        await prisma.browserSession.update({ where: { id: session.id }, data: { status: "ERROR", stoppedAt: new Date() } });
        throw e;
      }
      await prisma.browserSession.update({
        where: { id: session.id },
        data: { status: "RUNNING", containerRef: handle.containerRef }
      });
      await prisma.auditLog.create({ data: { actorId: userId, action: "browser.launch", targetType: "BrowserProfile", targetId: profile.id } });
      void BROWSER_LIMITS; // limits are sent to the orchestrator by the client
    }

    const token = await orchestrator.issueStreamToken(handle.sessionId);
    await prisma.browserSession.updateMany({
      where: { profileId: profile.id, status: "RUNNING" },
      data: { streamTokenHash: token.tokenHash, streamTokenExpiresAt: token.expiresAt, lastActiveAt: new Date() }
    });

    const publicBase = (process.env.ORCHESTRATOR_PUBLIC_URL || process.env.ORCHESTRATOR_URL).replace(/\/$/, "");
    const streamUrl = `${publicBase}/s/${handle.sessionId}/${encodeURIComponent(token.rawToken)}`;
    return NextResponse.json({ streamUrl, status: "running" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Browser launch failed.";
    return NextResponse.json(
      { error: `Browser could not start: ${message}` },
      { status: 502 }
    );
  }
}
