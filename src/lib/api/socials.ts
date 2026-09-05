"use server"

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sql } from "../db";
import { getSessionFromRequest } from "./session";
import type { SocialLink } from "../store";

function rowToSocial(row: Record<string, unknown>): SocialLink {
  return {
    id: row.id as string,
    label: (row.label as string) ?? "",
    url: (row.url as string) ?? "",
    icon: (row.icon as string) ?? "Globe",
    order: (row.order as number) ?? 0,
  };
}

export const getSocialsFn = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await sql`SELECT * FROM social_links ORDER BY "order"`;
  return rows.map((r) => rowToSocial(r as Record<string, unknown>));
});

const socialSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
  icon: z.string(),
  order: z.number(),
});

export const createSocialAction = createServerFn({ method: "POST" })
  .validator((raw: unknown) => socialSchema.parse(raw))
  .handler(async ({ data }) => {
    const session = await getSessionFromRequest();
    if (!session) throw new Error("Unauthorized");
    await sql`
      INSERT INTO social_links (id, label, url, icon, "order")
      VALUES (${data.id}, ${data.label}, ${data.url}, ${data.icon}, ${data.order})
    `;
    return { ok: true };
  });

const partialSocialSchema = socialSchema.partial().extend({ id: z.string() });

export const updateSocialAction = createServerFn({ method: "POST" })
  .validator((raw: unknown) => partialSocialSchema.parse(raw))
  .handler(async ({ data }) => {
    const session = await getSessionFromRequest();
    if (!session) throw new Error("Unauthorized");
    await sql`
      UPDATE social_links SET
        label   = COALESCE(${data.label ?? null}, label),
        url     = COALESCE(${data.url ?? null}, url),
        icon    = COALESCE(${data.icon ?? null}, icon),
        "order" = COALESCE(${data.order ?? null}, "order")
      WHERE id = ${data.id}
    `;
    return { ok: true };
  });

export const deleteSocialAction = createServerFn({ method: "POST" })
  .validator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const session = await getSessionFromRequest();
    if (!session) throw new Error("Unauthorized");
    await sql`DELETE FROM social_links WHERE id = ${data.id}`;
    return { ok: true };
  });
