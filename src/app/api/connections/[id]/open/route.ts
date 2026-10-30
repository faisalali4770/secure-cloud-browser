import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { getOrchestratorFor, isSessionInUse } from "@/lib/browser/orchestrator";
import { resolveOrchestratorBaseDetailed } from "@/lib/browser/host-endpoint";

// POST /api/connections/[id]/open — open the connection's MASTER browser
// so the owner can log into the account once (or refresh a dead login).
// Mirrors /api/browser/launch (same session lock, same one-time stream
// URL), minus the BrowserSession rows: a master is not a profile, its
// session lives only on the host, keyed by the connection's id.

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await params;

  const account = await prisma.connectedAccount.findFirst({ where: { id, ownerId: userId } });
  if (!account) return NextResponse.json({ error: "Connection not found." }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const force = !!(body && body.force === true);
  const mode = body && body.mode === "attach" ? ("attach" as const) : undefined;

  const resolved = await resolveOrchestratorBaseDetailed();
  if (!resolved) {
    return NextResponse.json(
      { error: "Browser host is not connected yet. Start the host on your PC first — then this button will work." },
      { status: 503 }
    );
  }
  const orchestrator = getOrchestratorFor(resolved.base);

  try {
    const detailed = await orchestrator.reconnectWithSession(account.id).catch(() => null);
    let handle = detailed?.handle ?? null;
    const liveSession = detailed?.session ?? null;
    if (handle && liveSession?.streamConnected && !force && mode !== "attach") {
      return NextResponse.json(
        { error: "session_in_use", startedAt: liveSession.startedAt, streamConnected: true },
        { status: 409 }
      );
    }
    if (handle && force) {
      await orchestrator.stop(handle.sessionId).catch(() => undefined);
      handle = null;
    }
    if (!handle) {
      handle = await orchestrator.launch({
        profileId: account.id,
        storageKey: account.storageKey,
        timezone: "UTC",
        locale: "en-US",
        viewportWidth: 1366,
        viewportHeight: 768,
        viewOnly: false,
        browser: "chromium",
        force: force || undefined,
        mode
      });
    }
    const token = await orchestrator.issueStreamToken(handle.sessionId);
    const publicBase = resolved.fromHeartbeat
      ? resolved.base
      : (process.env.ORCHESTRATOR_PUBLIC_URL || resolved.base).replace(/\/$/, "");
    const streamUrl = `${publicBase}/s/${handle.sessionId}/${encodeURIComponent(token.rawToken)}`;
    await prisma.auditLog.create({
      data: { actorId: userId, action: "connection.open", targetType: "ConnectedAccount", targetId: account.id }
    });
    return NextResponse.json({ streamUrl, status: "running" });
  } catch (e) {
    if (isSessionInUse(e)) {
      return NextResponse.json(
        { error: "session_in_use", startedAt: e.startedAt, streamConnected: e.streamConnected },
        { status: 409 }
      );
    }
    const message = e instanceof Error ? e.message : "Master browser could not start.";
    return NextResponse.json({ error: `Master browser khul nahi saka: ${message}` }, { status: 502 });
  }
}
