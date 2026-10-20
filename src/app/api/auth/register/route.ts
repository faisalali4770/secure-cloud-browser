import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";

// POST /api/auth/register — REAL Prisma-backed implementation.
// Creates the user with a hashed password and an email-verification token
// (hash stored only). Sending the verification email is NOT wired yet:
// in production the app must fail loudly if SMTP is unconfigured (v2 section 6),
// so until the mailer exists this returns 501 AFTER creating nothing if
// email is unconfigured in production.
const Body = z.object({
  email: z.string().email().max(254),
  password: z.string().min(10).max(128),
  displayName: z.string().min(1).max(80).optional()
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password (min 10 characters)." }, { status: 400 });
  }
  const { email, password, displayName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

  const user = await prisma.user.create({
    data: { email: email.toLowerCase(), passwordHash: await hashPassword(password), displayName }
  });

  const raw = generateRawToken();
  await prisma.emailVerificationToken.create({
    data: { userId: user.id, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + 24 * 3600 * 1000) }
  });
  // TODO Phase 1: send `raw` via the configured mailer (SMTP/Resend). Never log it.
  await prisma.auditLog.create({ data: { actorId: user.id, action: "auth.register" } });

  return NextResponse.json(
    { id: user.id, email: user.email, emailVerification: "pending — check your email to verify" },
    { status: 201 }
  );
}
