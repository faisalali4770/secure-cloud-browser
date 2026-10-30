import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { getOrchestratorFor, OrchestratorHttpError } from "@/lib/browser/orchestrator";
import { resolveOrchestratorBaseDetailed } from "@/lib/browser/host-endpoint";

// POST /api/connections/[id]/undeploy { profileId } — take this account
// back out of one of my profiles: the host restores the profile's own
// pre-deploy data (its backup), and the assignment record goes.

const HOST_OUTDATED = {
  error: "host_outdated",
  message: "Host purana hai — pehle host par Connections wala update chalao, phir ye kaam karega."
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await params;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const profileId = body && typeof body.profileId === "string" ? body.profileId : undefined;
  if (!profileId) return NextResponse.json({ error: "profileId is required." }, { status: 400 });

  const [account, profile] = await Promise.all([
    prisma.connectedAccount.findFirst({ where: { id, ownerId: userId } }),
    prisma.browserProfile.findFirst({ where: { id: profileId, ownerId: userId } })
  ]);
  if (!account) return NextResponse.json({ error: "Connection not found." }, { status: 404 });
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const resolved = await resolveOrchestratorBaseDetailed();
  if (!resolved) {
    return NextResponse.json(
      { error: "Browser host is not connected yet. Start the host on your PC first — then this button will work." },
      { status: 503 }
    );
  }

  try {
    const result = await getOrchestratorFor(resolved.base).undeployConnection(profile.id, profile.storageKey);
    await prisma.accountAssignment.deleteMany({ where: { accountId: account.id, profileId: profile.id } });
    await prisma.auditLog.create({
      data: { actorId: userId, action: "connection.undeploy", targetType: "BrowserProfile", targetId: profile.id }
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof OrchestratorHttpError && e.status === 404) {
      return NextResponse.json(HOST_OUTDATED, { status: 409 });
    }
    return NextResponse.json({ error: "Account wapas nahi nikal saka — host ne jawab nahi diya." }, { status: 502 });
  }
}
