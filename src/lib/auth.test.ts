import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { checkPassword, createSessionToken, isAuthConfigured, isValidSessionToken } from "./auth";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.APP_PASSWORD = "correct-horse-battery-staple";
  process.env.SESSION_SECRET = "test-secret-value";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("isAuthConfigured", () => {
  it("is true when both APP_PASSWORD and SESSION_SECRET are set", () => {
    expect(isAuthConfigured()).toBe(true);
  });

  it("is false when APP_PASSWORD is missing", () => {
    delete process.env.APP_PASSWORD;
    expect(isAuthConfigured()).toBe(false);
  });

  it("is false when SESSION_SECRET is missing", () => {
    delete process.env.SESSION_SECRET;
    expect(isAuthConfigured()).toBe(false);
  });
});

describe("checkPassword", () => {
  it("accepts the correct password", () => {
    expect(checkPassword("correct-horse-battery-staple")).toBe(true);
  });

  it("rejects an incorrect password", () => {
    expect(checkPassword("wrong-password")).toBe(false);
  });

  it("rejects a password of a different length without throwing", () => {
    expect(checkPassword("short")).toBe(false);
    expect(checkPassword("a-much-longer-guess-than-the-real-password")).toBe(false);
  });

  it("rejects everything when APP_PASSWORD isn't configured", () => {
    delete process.env.APP_PASSWORD;
    expect(checkPassword("correct-horse-battery-staple")).toBe(false);
    expect(checkPassword("")).toBe(false);
  });
});

describe("createSessionToken / isValidSessionToken", () => {
  it("round-trips: a freshly created token validates", () => {
    const token = createSessionToken();
    expect(token).not.toBeNull();
    expect(isValidSessionToken(token)).toBe(true);
  });

  it("is deterministic for the same secret", () => {
    expect(createSessionToken()).toBe(createSessionToken());
  });

  it("changes when the secret changes", () => {
    const tokenA = createSessionToken();
    process.env.SESSION_SECRET = "a-different-secret";
    const tokenB = createSessionToken();
    expect(tokenA).not.toBe(tokenB);
  });

  it("rejects a garbage token", () => {
    expect(isValidSessionToken("not-a-real-token")).toBe(false);
  });

  it("rejects a missing token", () => {
    expect(isValidSessionToken(undefined)).toBe(false);
    expect(isValidSessionToken(null)).toBe(false);
  });

  it("returns null and rejects everything when SESSION_SECRET isn't configured", () => {
    delete process.env.SESSION_SECRET;
    expect(createSessionToken()).toBeNull();
    expect(isValidSessionToken("anything")).toBe(false);
  });
});
