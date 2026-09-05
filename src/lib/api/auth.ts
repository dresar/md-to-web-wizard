"use server";

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sql } from "../db";
import { runMigrations } from "../db-migrate";
import {
  createSessionToken,
  getCookieName,
} from "../auth";
import { getSessionFromRequest } from "./session";

// Run migrations on first server-function call (idempotent)
let migrated = false;
async function ensureMigrated() {
  if (!migrated) {
    await runMigrations();
    migrated = true;
  }
}

// ─── Login ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const loginAction = createServerFn({ method: "POST" })
  .validator((raw: unknown) => loginSchema.parse(raw))
  .handler(async ({ data }) => {
    await ensureMigrated();

    const rows = await sql`SELECT id, username, password_hash FROM users WHERE username = ${data.username} LIMIT 1`;
    if (!rows.length) {
      return { ok: false, error: "Username atau password salah." };
    }

    const user = rows[0] as { id: number; username: string; password_hash: string };
    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) {
      return { ok: false, error: "Username atau password salah." };
    }

    const { setCookie } = await import("@tanstack/react-start/server");
    const token = await createSessionToken({ userId: user.id, username: user.username });
    setCookie(getCookieName(), token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "lax" });

    return { ok: true };
  });

// ─── Logout ──────────────────────────────────────────────────────────────────

export const logoutAction = createServerFn({ method: "POST" }).handler(async () => {
  const { setCookie } = await import("@tanstack/react-start/server");
  setCookie(getCookieName(), "", { httpOnly: true, path: "/", maxAge: 0, sameSite: "lax" });
  return { ok: true };
});

// ─── Get Session ──────────────────────────────────────────────────────────────

export const getSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  return await getSessionFromRequest();
});

// ─── Get Current User Account ──────────────────────────────────────────────────

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureMigrated();
  const session = await getSessionFromRequest();
  if (!session) return null;

  const rows = await sql`SELECT id, username, email FROM users WHERE id = ${session.userId} LIMIT 1`;
  if (!rows.length) return null;
  return rows[0] as { id: number; username: string; email: string };
});

// ─── Update Account ────────────────────────────────────────────────────────────

const updateAccountSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  email: z.string().email("Format email tidak valid").or(z.literal("")),
  password: z.string().optional(),
});

export const updateAccountAction = createServerFn({ method: "POST" })
  .validator((raw: unknown) => updateAccountSchema.parse(raw))
  .handler(async ({ data }) => {
    await ensureMigrated();
    const session = await getSessionFromRequest();
    if (!session) {
      return { ok: false, error: "Sesi tidak valid atau telah berakhir." };
    }

    const userId = session.userId;

    // Check if username is already taken by another user
    const existingUser = await sql`SELECT id FROM users WHERE username = ${data.username} AND id != ${userId} LIMIT 1`;
    if (existingUser.length) {
      return { ok: false, error: "Username sudah digunakan oleh akun lain." };
    }

    // Check if email is already taken by another user
    if (data.email) {
      const existingEmail = await sql`SELECT id FROM users WHERE email = ${data.email} AND id != ${userId} LIMIT 1`;
      if (existingEmail.length) {
        return { ok: false, error: "Email sudah digunakan oleh akun lain." };
      }
    }

    if (data.password && data.password.trim() !== "") {
      if (data.password.length < 6) {
        return { ok: false, error: "Password minimal 6 karakter." };
      }
      const hash = await bcrypt.hash(data.password, 10);
      await sql`
        UPDATE users 
        SET username = ${data.username}, email = ${data.email}, password_hash = ${hash} 
        WHERE id = ${userId}
      `;
    } else {
      await sql`
        UPDATE users 
        SET username = ${data.username}, email = ${data.email} 
        WHERE id = ${userId}
      `;
    }

    // Update session cookie since username might have changed
    const { setCookie } = await import("@tanstack/react-start/server");
    const token = await createSessionToken({ userId, username: data.username });
    setCookie(getCookieName(), token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "lax" });

    return { ok: true };
  });
