"use server"

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sql } from "../db";
import { getSessionFromRequest } from "./session";
import type { Profile } from "../store";

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    name: (row.name as string) ?? "",
    title: (row.title as string) ?? "",
    description: (row.description as string) ?? "",
    avatarUrl: (row.avatar_url as string) ?? "",
    verified: (row.verified as boolean) ?? false,
    whatsappNumber: (row.whatsapp_number as string) ?? "",
    slug: (row.slug as string) ?? "",
  };
}

export const getProfileFn = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await sql`SELECT * FROM profiles LIMIT 1`;
  if (!rows.length) return null;
  return rowToProfile(rows[0] as Record<string, unknown>);
});

const profileSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  avatarUrl: z.string().optional(),
  verified: z.boolean().optional(),
  whatsappNumber: z.string().optional(),
  slug: z.string().optional(),
});

export const updateProfileAction = createServerFn({ method: "POST" })
  .validator((raw: unknown) => profileSchema.parse(raw))
  .handler(async ({ data }) => {
    const session = await getSessionFromRequest();
    if (!session) throw new Error("Unauthorized");

    const existing = await sql`SELECT id FROM profiles LIMIT 1`;
    if (!existing.length) {
      await sql`
        INSERT INTO profiles (name, title, description, avatar_url, verified, whatsapp_number, slug)
        VALUES (
          ${data.name ?? ""},
          ${data.title ?? ""},
          ${data.description ?? ""},
          ${data.avatarUrl ?? ""},
          ${data.verified ?? false},
          ${data.whatsappNumber ?? ""},
          ${data.slug ?? ""}
        )
      `;
    } else {
      await sql`
        UPDATE profiles SET
          name              = COALESCE(${data.name ?? null}, name),
          title             = COALESCE(${data.title ?? null}, title),
          description       = COALESCE(${data.description ?? null}, description),
          avatar_url        = COALESCE(${data.avatarUrl ?? null}, avatar_url),
          verified          = COALESCE(${data.verified ?? null}, verified),
          whatsapp_number   = COALESCE(${data.whatsappNumber ?? null}, whatsapp_number),
          slug              = COALESCE(${data.slug ?? null}, slug)
        WHERE id = ${(existing[0] as { id: number }).id}
      `;
    }
    return { ok: true };
  });
