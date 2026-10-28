import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { BROWSER_LIMITS } from "@/lib/browser/orchestrator";

// /api/browser/profiles — the signed-in user's OWN browser profiles.
// GET lists them; POST creates one (name + browser engine choice), subject
// to BROWSER_LIMITS.maxProfilesPerUser. Profiles are strictly per-user:
// every query is scoped by ownerId, so one user can never see or create
// profiles for another. (Sharing profiles with other people is a separate
// feature and is NOT part of this route.)

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const rows = await prisma.browserProfile.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" }
  });
  return NextResponse.json({
    profiles: rows.map((p) => ({ id: p.id, name: p.name, browser: p.browser, createdAt: p.createdAt }))
  });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

  const name = body && typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 1 || name.length > 40) {
    return NextResponse.json({ error: "Profile name must be 1–40 characters." }, { status: 400 });
  }
  const browser = body?.browser;
  if (browser !== "chromium" && browser !== "firefox") {
    return NextResponse.json({ error: 'Browser must be "chromium" or "firefox".' }, { status: 400 });
  }

  const count = await prisma.browserProfile.count({ where: { ownerId: userId } });
  if (count >= BROWSER_LIMITS.maxProfilesPerUser) {
    return NextResponse.json(
      { error: `Profile limit reached — you can have at most ${BROWSER_LIMITS.maxProfilesPerUser} profiles.` },
      { status: 400 }
    );
  }

  // storageKey is unique per profile: user prefix + 8 lowercase hex chars,
  // so additional profiles never collide with the default profile's
  // `u-<userId>` key.
  const storageKey = `u-${userId}-${randomBytes(4).toString("hex")}`;
  const profile = await prisma.browserProfile.create({
    data: { ownerId: userId, name, browser, storageKey }
  });
  return NextResponse.json(
    { id: profile.id, name: profile.name, browser: profile.browser, createdAt: profile.createdAt },
    { status: 201 }
  );
}
