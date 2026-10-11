// In-memory login lockout. The app has exactly one shared password, so a single
// global counter (rather than per-IP) is what actually stops a brute-force
// guesser — per-IP tracking would just be worked around by spoofing
// X-Forwarded-For, which isn't trustworthy without a known trusted proxy in
// front of this app anyway.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

let failedCount = 0;
let windowStart = 0;
let lockedUntil = 0;

export function isLockedOut(): boolean {
  return Date.now() < lockedUntil;
}

export function lockoutRemainingSeconds(): number {
  return Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
}

export function recordFailedLoginAttempt(): void {
  const now = Date.now();
  if (now - windowStart > WINDOW_MS) {
    windowStart = now;
    failedCount = 0;
  }
  failedCount += 1;
  if (failedCount >= MAX_ATTEMPTS) {
    lockedUntil = now + LOCKOUT_MS;
  }
}

export function recordSuccessfulLogin(): void {
  failedCount = 0;
  windowStart = 0;
  lockedUntil = 0;
}

export function resetLoginRateLimiter(): void {
  failedCount = 0;
  windowStart = 0;
  lockedUntil = 0;
}
