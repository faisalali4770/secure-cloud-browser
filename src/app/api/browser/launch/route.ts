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
    let sessionRowId: string;
    if (handle) {
      // Live on the host. Reuse the newest open row for the token record,
      // or open one if the app lost track of the live session.
      const open = await prisma.browserSession.findFirst({
        where: { profileId: profile.id, status: { in: ["STARTING", "RUNNING"] } },
        orderBy: { createdAt: "desc" }
      });
      if (open) {
        sessionRowId = open.id;
        if (open.status !== "RUNNING") {
          await prisma.browserSession.update({
            where: { id: open.id },
            data: { status: "RUNNING", containerRef: handle.containerRef }
          });
        }
      } else {
        const created = await prisma.browserSession.create({
          data: { profileId: profile.id, startedById: userId, status: "RUNNING", containerRef: handle.containerRef }
        });
        sessionRowId = created.id;
      }
    } else {
      // Nothing live on the host, so any rows still marked open are stale:
      // the host stops sessions on its own when profiles switch, without
      // the app being told. Close them first — otherwise the token write
      // below can touch several RUNNING rows at once, and writing one
      // streamTokenHash to multiple rows violates its unique constraint
      // (seen live 2026-10-23, right after a host-side auto-stop).
      await prisma.browserSession.updateMany({
        where: { profileId: profile.id, status: { in: ["STARTING", "RUNNING"] } },
        data: { status: "STOPPED", stoppedAt: new Date(), streamTokenHash: null, streamTokenExpiresAt: null }
      });
      const session = await prisma.browserSession.create({
        data: { profileId: profile.id, startedById: userId, status: "STARTING" }
      });
      sessionRowId = session.id;
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

    if (!handle) throw new Error("Browser launch produced no session handle.");
    const token = await orchestrator.issueStreamToken(handle.sessionId);
    // Write the token to exactly ONE row (see the stale-row note above).
    await prisma.browserSession.update({
      where: { id: sessionRowId },
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
