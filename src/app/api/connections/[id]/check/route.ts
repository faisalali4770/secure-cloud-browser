import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { getOrchestratorFor, OrchestratorHttpError } from "@/lib/browser/orchestrator";
import { resolveOrchestratorBaseDetailed } from "@/lib/browser/host-endpoint";

// POST /api/connections/[id]/check — is the master login still there?
// Asks the host whether the master profile holds any cookies for the
// account's site (for a Google-type connection: for google.com). This is
// a presence check, not a promise — a site can kill a session whose
// cookies still sit on disk, so the panel words it as an estimate.

const HOST_OUTDATED = {
  error: "host_outdated",
  message: "Host purana hai — pehle host par Connections wala update chalao, phir ye kaam karega."
};

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await params;

  const account = await prisma.connectedAccount.findFirst({ where: { id, ownerId: userId } });
  if (!account) return NextResponse.json({ error: "Connection not found." }, { status: 404 });

  let host = "google.com";
  if (account.loginType !== "google") {
    try {
      host = new URL(account.siteUrl).hostname.replace(/^www\./, "");
    } catch {
      host = "google.com";
    }
  }

  const resolved = await resolveOrchestratorBaseDetailed();
  if (!resolved) {
    return NextResponse.json(
      { error: "Browser host is not connected yet. Start the host on your PC first — then this button will work." },
      { status: 503 }
    );
  }

  try {
    const result = await getOrchestratorFor(resolved.base).connectionCheck(account.id, account.storageKey, host);
    return NextResponse.json({ ...result, host });
  } catch (e) {
    if (e instanceof OrchestratorHttpError && e.status === 404) {
      return NextResponse.json(HOST_OUTDATED, { status: 409 });
    }
    return NextResponse.json({ error: "Login check nahi ho saka — host ne jawab nahi diya." }, { status: 502 });
  }
}
