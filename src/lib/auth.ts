import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE_NAME = "wholesale_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSessionSecret(): string | null {
  return process.env.SESSION_SECRET || null;
}

export function isAuthConfigured() {
  return Boolean(process.env.APP_PASSWORD && getSessionSecret());
}

export function checkPassword(password: string) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function createSessionToken(): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update("wholesale-authenticated").digest("hex");
}

export function isValidSessionToken(token: string | undefined | null): boolean {
  const expected = createSessionToken();
  if (!expected || !token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
