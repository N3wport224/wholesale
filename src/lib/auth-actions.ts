"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE_NAME,
  checkPassword,
  createSessionToken,
  isAuthConfigured,
  sessionCookieOptions,
} from "@/lib/auth";
import {
  isLockedOut,
  lockoutRemainingSeconds,
  recordFailedLoginAttempt,
  recordSuccessfulLogin,
} from "@/lib/rate-limit";

export type LoginState = { error?: string };

function lockoutMessage() {
  const seconds = lockoutRemainingSeconds();
  const minutes = Math.ceil(seconds / 60);
  return `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  if (!isAuthConfigured()) {
    return {
      error: "APP_PASSWORD and SESSION_SECRET aren't set on the server yet — see .env.example.",
    };
  }

  if (isLockedOut()) {
    return { error: lockoutMessage() };
  }

  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  if (!checkPassword(password)) {
    recordFailedLoginAttempt();
    return { error: isLockedOut() ? lockoutMessage() : "Incorrect password." };
  }

  recordSuccessfulLogin();
  const token = createSessionToken();
  if (!token) return { error: "Server session isn't configured." };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
