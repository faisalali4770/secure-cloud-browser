import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { getOrchestratorFor } from "@/lib/browser/orchestrator";
import { resolveOrchestratorBaseDetailed } from "@/lib/browser/host-endpoint";

// POST /api/connections/[id]/close — stop the connection's master browser
// (its saved login stays on the host; only the running session ends).
// Stopping gracefully matters: Chrome commits its cookies on clean exit,
// which is exactly what a later Deploy copies.

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await params;

  const account = await prisma.connectedAccount.findFirst({ where: { id, ownerId: userId } });
  if (!account) return NextResponse.json({ error: "Connection not found." }, { status: 404 });

  const resolved = await resolveOrchestratorBaseDetailed();
  if (!resolved) {
    return NextResponse.json(
      { error: "Browser host is not connected yet. Start the host on your PC first — then this button will work." },
      { status: 503 }
    );
  }
  const orchestrator = getOrchestratorFor(resolved.base);
  const handle = await orchestrator.reconnect(account.id).catch(() => null);
  if (!handle) return NextResponse.json({ ok: true, wasRunning: false });
  await orchestrator.stop(handle.sessionId);
  return NextResponse.json({ ok: true, wasRunning: true });
}
