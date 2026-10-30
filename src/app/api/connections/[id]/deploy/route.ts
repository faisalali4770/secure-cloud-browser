import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { getOrchestratorFor, OrchestratorHttpError } from "@/lib/browser/orchestrator";
import { resolveOrchestratorBaseDetailed } from "@/lib/browser/host-endpoint";

// POST /api/connections/[id]/deploy { profileId } — copy this account's
// saved login into one of my profiles (host-side: the profile's own data
// is backed up first, the account site becomes its bookmark + startup
// page). The profile then opens already signed in — no login, no
// password. A pre-v22 host answers 404 -> honest host_outdated notice;
// a master with no login data yet answers source_empty.

const HOST_OUTDATED = {
  error: "host_outdated",
  message: "Host purana hai — pehle host par Connections wala update chalao, phir Deploy kaam karega."
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
    const result = await getOrchestratorFor(resolved.base).deployConnection(profile.id, {
      storageKey: profile.storageKey,
      sourceStorageKey: account.storageKey,
      sourceProfileId: account.id,
      label: account.label,
      siteUrl: account.siteUrl
    });
    await prisma.accountAssignment.upsert({
      where: { accountId_profileId: { accountId: account.id, profileId: profile.id } },
      create: { accountId: account.id, profileId: profile.id, deployedAt: new Date() },
      update: { deployedAt: new Date() }
    });
    await prisma.auditLog.create({
      data: { actorId: userId, action: "connection.deploy", targetType: "BrowserProfile", targetId: profile.id }
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof OrchestratorHttpError) {
      if (e.hostError === "source_empty") {
        return NextResponse.json(
          { error: "source_empty", message: "Is account ka koi login data host par nahi mila — pehle 'Login karo' se account khol kar login karo, phir Deploy karo." },
          { status: 422 }
        );
      }
      if (e.status === 404) return NextResponse.json(HOST_OUTDATED, { status: 409 });
    }
    return NextResponse.json({ error: "Deploy nahi ho saka — host ne jawab nahi diya." }, { status: 502 });
  }
}
