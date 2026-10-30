import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";

// Connections (Phase 5): the owner's master accounts. Each connection is
// ONE account the owner logs into once (in a master browser on the host);
// its saved login can then be deployed into any of the owner's profiles,
// which open already signed in — no password is ever shared.
//
// GET  /api/connections — my connections (with their assignments) plus my
//      profiles, so the panel renders everything from one fetch.
// POST /api/connections — create a connection { label, siteUrl, loginType }.
//      loginType "google" marks an account that signs in with Google
//      (Gmail); the panel warns that deploying it also opens Gmail/Drive
//      inside the assigned profile.

const MAX_CONNECTIONS_PER_USER = 10;

export function normalizeSiteUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let s = raw.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const [connections, profiles] = await Promise.all([
    prisma.connectedAccount.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "asc" },
      include: { assignments: { select: { profileId: true, deployedAt: true } } }
    }),
    prisma.browserProfile.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, browser: true, description: true }
    })
  ]);
  return NextResponse.json({ connections, profiles });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const label = body && typeof body.label === "string" ? body.label.trim().slice(0, 120) : "";
  const siteUrl = normalizeSiteUrl(body?.siteUrl);
  const loginType = body?.loginType === "google" ? "google" : "site";
  if (!label) return NextResponse.json({ error: "Account ka naam (label) lazmi hai." }, { status: 400 });
  if (!siteUrl) return NextResponse.json({ error: "Site ka pata (URL) theek nahi hai." }, { status: 400 });

  const count = await prisma.connectedAccount.count({ where: { ownerId: userId } });
  if (count >= MAX_CONNECTIONS_PER_USER) {
    return NextResponse.json({ error: `Ek waqt mein zyada se zyada ${MAX_CONNECTIONS_PER_USER} connections bana sakte ho.` }, { status: 400 });
  }

  const storageKey = `acct-${userId.slice(0, 8)}-${randomBytes(4).toString("hex")}`;
  const account = await prisma.connectedAccount.create({
    data: { ownerId: userId, label, siteUrl, loginType, storageKey }
  });
  await prisma.auditLog.create({
    data: { actorId: userId, action: "connection.create", targetType: "ConnectedAccount", targetId: account.id }
  });
  return NextResponse.json({ connection: account }, { status: 201 });
}
