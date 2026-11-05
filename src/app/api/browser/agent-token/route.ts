import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { getOrchestratorFor, OrchestratorHttpError } from "@/lib/browser/orchestrator";
import { resolveOrchestratorBaseDetailed } from "@/lib/browser/host-endpoint";

// POST /api/browser/agent-token { profileId, ttlMinutes? } — mint a scoped
// CODE ACCESS token for one of the caller's own profiles (v21 host
// feature). The token lets an AI agent drive that profile's Chrome via
// the DevTools protocol through the host's /cdp/<token> gate — no screen
// stream, no password sharing. The raw token is shown ONCE, here; the
// host stores only its SHA-256 hash. Default life 12 hours.
//
// DELETE /api/browser/agent-token { profileId } — revoke that profile's
// code-access tokens.
//
// A pre-v21 host answers 404 for the mint endpoint, which becomes an
// honest "host purana hai" notice rather than a bare failure.

const HOST_OUTDATED = {
  error: "host_outdated",
  message: "Host purana hai — pehle PC par naya setup (v21) chalao, phir code access milega."
};

async function ownedProfile(userId: string, profileId: string) {
  return prisma.browserProfile.findFirst({ where: { id: profileId, ownerId: userId } });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const profileId = body && typeof body.profileId === "string" ? body.profileId : undefined;
  const ttlMinutes = body && typeof body.ttlMinutes === "number" ? body.ttlMinutes : undefined;
  if (!profileId) return NextResponse.json({ error: "profileId is required." }, { status: 400 });

  const resolved = await resolveOrchestratorBaseDetailed();
  if (!resolved) {
    return NextResponse.json(
      { error: "Browser host is not connected yet. Start the host on your PC first." },
      { status: 503 }
    );
  }

  const profile = await ownedProfile(userId, profileId);
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  if (profile.browser === "firefox") {
    return NextResponse.json(
      { error: "code_access_chromium_only", message: "Code access sirf Chrome profiles ke liye hai." },
      { status: 400 }
    );
  }

  try {
    const minted = await getOrchestratorFor(resolved.base).mintAgentToken(profile.id, ttlMinutes);
    return NextResponse.json({
      token: minted.token,
      expiresAt: minted.expiresAt,
      cdpBase: `${resolved.base.replace(/\/$/, "")}/cdp/${minted.token}`
    });
  } catch (e) {
    if (e instanceof OrchestratorHttpError && e.status === 404) {
      return NextResponse.json(HOST_OUTDATED, { status: 409 });
    }
    return NextResponse.json({ error: "Code access token nahi ban saka — host ne jawab nahi diya." }, { status: 502 });
  }
}

export async function DELETE(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const profileId = body && typeof body.profileId === "string" ? body.profileId : undefined;
  if (!profileId) return NextResponse.json({ error: "profileId is required." }, { status: 400 });

  const resolved = await resolveOrchestratorBaseDetailed();
  if (!resolved) {
    return NextResponse.json(
      { error: "Browser host is not connected yet. Start the host on your PC first." },
      { status: 503 }
    );
  }

  const profile = await ownedProfile(userId, profileId);
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  try {
    await getOrchestratorFor(resolved.base).revokeAgentToken(profile.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof OrchestratorHttpError && e.status === 404) {
      return NextResponse.json(HOST_OUTDATED, { status: 409 });
    }
    return NextResponse.json({ error: "Token revoke nahi ho saka — host ne jawab nahi diya." }, { status: 502 });
  }
}
