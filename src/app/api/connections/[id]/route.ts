import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { getOrchestratorFor } from "@/lib/browser/orchestrator";
import { resolveOrchestratorBaseDetailed } from "@/lib/browser/host-endpoint";
import { normalizeSiteUrl } from "@/lib/connections";

// PATCH  /api/connections/[id] — rename / change site / change login type.
// DELETE /api/connections/[id] — remove the connection completely: every
// assignment is undeployed first (each profile gets its own pre-deploy
// data back), then the master's saved data is deleted from the host,
// then the row goes. When the host is unreachable the row still goes and
// the response says the host copy was left behind (hostCleaned: false).

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await params;

  const account = await prisma.connectedAccount.findFirst({ where: { id, ownerId: userId } });
  if (!account) return NextResponse.json({ error: "Connection not found." }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const data: { label?: string; siteUrl?: string; loginType?: string } = {};
  if (body && typeof body.label === "string" && body.label.trim()) data.label = body.label.trim().slice(0, 120);
  if (body && body.siteUrl !== undefined) {
    const siteUrl = normalizeSiteUrl(body.siteUrl);
    if (!siteUrl) return NextResponse.json({ error: "Site ka pata (URL) theek nahi hai." }, { status: 400 });
    data.siteUrl = siteUrl;
  }
  if (body && (body.loginType === "google" || body.loginType === "site")) data.loginType = body.loginType;

  const updated = await prisma.connectedAccount.update({ where: { id }, data });
  return NextResponse.json({ connection: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await params;

  const account = await prisma.connectedAccount.findFirst({
    where: { id, ownerId: userId },
    include: { assignments: { include: { profile: { select: { id: true, storageKey: true } } } } }
  });
  if (!account) return NextResponse.json({ error: "Connection not found." }, { status: 404 });

  let hostCleaned = false;
  const resolved = await resolveOrchestratorBaseDetailed();
  if (resolved) {
    const orchestrator = getOrchestratorFor(resolved.base);
    // Undeploy everywhere first (restores each profile's own data),
    // then delete the master's saved data from the host.
    for (const a of account.assignments) {
      await orchestrator.undeployConnection(a.profile.id, a.profile.storageKey).catch(() => undefined);
    }
    await orchestrator.deleteProfileData(account.id, account.storageKey).catch(() => undefined);
    hostCleaned = true;
  }

  await prisma.connectedAccount.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { actorId: userId, action: "connection.delete", targetType: "ConnectedAccount", targetId: id }
  });
  return NextResponse.json({ ok: true, hostCleaned });
}
