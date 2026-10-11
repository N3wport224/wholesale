import { beforeEach, describe, expect, it } from "vitest";
import {
  isLockedOut,
  lockoutRemainingSeconds,
  recordFailedLoginAttempt,
  recordSuccessfulLogin,
  resetLoginRateLimiter,
} from "./rate-limit";

beforeEach(() => {
  resetLoginRateLimiter();
});

describe("login rate limiter", () => {
  it("is not locked out with no attempts", () => {
    expect(isLockedOut()).toBe(false);
  });

  it("is not locked out after a few failed attempts", () => {
    recordFailedLoginAttempt();
    recordFailedLoginAttempt();
    recordFailedLoginAttempt();
    expect(isLockedOut()).toBe(false);
  });

  it("locks out after 5 failed attempts", () => {
    for (let i = 0; i < 5; i++) recordFailedLoginAttempt();
    expect(isLockedOut()).toBe(true);
    expect(lockoutRemainingSeconds()).toBeGreaterThan(0);
  });

  it("clears the lockout on a successful login", () => {
    for (let i = 0; i < 5; i++) recordFailedLoginAttempt();
    expect(isLockedOut()).toBe(true);
    recordSuccessfulLogin();
    expect(isLockedOut()).toBe(false);
  });

  it("reports zero remaining seconds when not locked out", () => {
    expect(lockoutRemainingSeconds()).toBe(0);
  });
});
