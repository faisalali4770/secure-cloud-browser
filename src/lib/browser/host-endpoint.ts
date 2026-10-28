import { prisma } from "@/lib/prisma";

// Dynamic orchestrator base URL resolution.
//
// The PC host is reached through a free tunnel whose URL changes on every
// host restart, so a static ORCHESTRATOR_URL goes stale. Instead, the PC
// agent POSTs a heartbeat with its current tunnel URL to
// /api/host/heartbeat, which stores it in the single-row HostEndpoint
// table. Resolution rule everywhere in the app:
//   1. the heartbeated URL, if its last heartbeat is <= 180 seconds old;
//   2. otherwise process.env.ORCHESTRATOR_URL;
//   3. otherwise null (no host configured — callers answer honestly).

const HOST_ENDPOINT_ID = "pc-host";
const HEARTBEAT_MAX_AGE_MS = 180_000; // 180 seconds

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export async function recordHostHeartbeat(url: string): Promise<void> {
  const clean = stripTrailingSlash(url);
  await prisma.hostEndpoint.upsert({
    where: { id: HOST_ENDPOINT_ID },
    create: { id: HOST_ENDPOINT_ID, url: clean },
    update: { url: clean }
  });
}

export interface ResolvedOrchestratorBase {
  base: string; // orchestrator base URL, never with a trailing slash
  fromHeartbeat: boolean; // true when the base came from a fresh heartbeat
}

export async function resolveOrchestratorBaseDetailed(): Promise<ResolvedOrchestratorBase | null> {
  try {
    const row = await prisma.hostEndpoint.findUnique({ where: { id: HOST_ENDPOINT_ID } });
    if (row && Date.now() - row.updatedAt.getTime() <= HEARTBEAT_MAX_AGE_MS) {
      return { base: stripTrailingSlash(row.url), fromHeartbeat: true };
    }
  } catch {
    // HostEndpoint table missing (schema not pushed yet) or DB unreachable —
    // fall through to the env var instead of failing the request.
  }
  const env = process.env.ORCHESTRATOR_URL;
  if (env) return { base: stripTrailingSlash(env), fromHeartbeat: false };
  return null;
}

export async function resolveOrchestratorBase(): Promise<string | null> {
  const resolved = await resolveOrchestratorBaseDetailed();
  return resolved ? resolved.base : null;
}
