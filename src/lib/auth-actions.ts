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

export type LoginState = { error?: string };

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  if (!isAuthConfigured()) {
    return {
      error: "APP_PASSWORD and SESSION_SECRET aren't set on the server yet — see .env.example.",
    };
  }

  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  if (!checkPassword(password)) {
    return { error: "Incorrect password." };
  }

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
