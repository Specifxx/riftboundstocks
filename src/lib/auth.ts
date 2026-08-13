import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cache } from "react";
import { randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { ACCOUNTS_ENABLED } from "./site";

const SESSION_COOKIE = "rl_session";

// Every /api/auth/* route calls this first. Protects a direct POST from
// throwing a raw Prisma "DATABASE_URL not found" error when a deployment has
// no database configured — the UI already hides these forms in that case (see
// ACCOUNTS_ENABLED in lib/site.ts), this is the belt-and-suspenders API guard.
export function accountsDisabledResponse(): NextResponse | null {
  if (ACCOUNTS_ENABLED) return null;
  return NextResponse.json({ error: "Accounts aren't configured on this deployment." }, { status: 503 });
}

// Resolve the session-signing secret lazily so a missing value fails at request
// time (not build time). In production we refuse to fall back to a known default
// — signing sessions with a public, hardcoded secret would let anyone forge a
// cookie for any user (full account takeover). Outside production we allow a
// dev-only secret with a loud warning.
let cachedSecret: Uint8Array | null = null;
function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const s = process.env.AUTH_SECRET;
  if (!s || s === "change-me-in-production") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "AUTH_SECRET is not set (or still the insecure default). Refusing to sign/verify " +
          "sessions in production. Generate one with: " +
          "node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
      );
    }
    console.warn(
      "[auth] AUTH_SECRET not set — using an insecure development-only secret. NEVER use this in production."
    );
    cachedSecret = new TextEncoder().encode("riftledger-dev-secret-change-me");
    return cachedSecret;
  }
  cachedSecret = new TextEncoder().encode(s);
  return cachedSecret;
}

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// One-time tokens for email verification / password reset.
export async function createAuthToken(
  userId: string,
  purpose: "verify" | "reset",
  ttlMs = 60 * 60 * 1000
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await prisma.authToken.create({
    data: { token, purpose, userId, expiresAt: new Date(Date.now() + ttlMs) },
  });
  return token;
}

// Consume a token: returns the userId if valid+unexpired (and deletes it), else null.
export async function consumeAuthToken(token: string, purpose: "verify" | "reset"): Promise<string | null> {
  const row = await prisma.authToken.findUnique({ where: { token } });
  if (!row || row.purpose !== purpose) return null;
  await prisma.authToken.delete({ where: { id: row.id } }).catch(() => {});
  if (row.expiresAt.getTime() < Date.now()) return null;
  return row.userId;
}

// Issue a signed session cookie for the given user id.
export async function createSession(userId: string): Promise<void> {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function destroySession(): void {
  cookies().set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}

// Read + verify the session cookie and load the current user, or null.
// Request-memoised so a layout and a page can both read the user within one
// render without a second DB round-trip.
export const getCurrentUser = cache(async function getCurrentUser(): Promise<SessionUser | null> {
  if (!ACCOUNTS_ENABLED) return null;
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.sub as string;
    if (!userId) return null;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      emailVerified: !!user.emailVerified,
    };
  } catch {
    return null;
  }
});
