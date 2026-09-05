"use server";

import { verifySessionToken, getCookieName } from "../auth";
import type { SessionPayload } from "../auth";

export async function getSessionFromRequest(): Promise<SessionPayload | null> {
  const { getCookie } = await import("@tanstack/react-start/server");
  const token = getCookie(getCookieName());
  if (!token) return null;
  return verifySessionToken(token);
}
