"use server"

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sql } from "../db";
import { getSessionFromRequest } from "./session";
import type { SiteSettings, AccentName } from "../store";

function rowToSettings(row: Record<string, unknown>): SiteSettings {
  return {
    siteTitle: (row.site_title as string) ?? "Bio Link",
    siteDescription: (row.site_description as string) ?? "",
    accent: (row.accent as AccentName) ?? "blue",
    theme: (row.theme as "dark" | "light") ?? "dark",
    imagekitPublicKey: (row.imagekit_public_key as string) ?? "",
    imagekitPrivateKey: (row.imagekit_private_key as string) ?? "",
    imagekitUrlEndpoint: (row.imagekit_url_endpoint as string) ?? "",
  };
}

export const getSettingsFn = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await sql`SELECT * FROM site_settings LIMIT 1`;
  if (!rows.length) {
    return {
      siteTitle: "Bio Link",
      siteDescription: "",
      accent: "blue" as AccentName,
      theme: "dark" as const,
      imagekitPublicKey: "",
      imagekitPrivateKey: "",
      imagekitUrlEndpoint: "",
    };
  }
  return rowToSettings(rows[0] as Record<string, unknown>);
});

const settingsSchema = z.object({
  siteTitle: z.string().optional(),
  siteDescription: z.string().optional(),
  accent: z.string().optional(),
  theme: z.enum(["dark", "light"]).optional(),
  imagekitPublicKey: z.string().optional(),
  imagekitPrivateKey: z.string().optional(),
  imagekitUrlEndpoint: z.string().optional(),
});

export const updateSettingsAction = createServerFn({ method: "POST" })
  .validator((raw: unknown) => settingsSchema.parse(raw))
  .handler(async ({ data }) => {
    const session = await getSessionFromRequest();
    if (!session) throw new Error("Unauthorized");

    const existing = await sql`SELECT id FROM site_settings LIMIT 1`;
    if (!existing.length) {
      await sql`
        INSERT INTO site_settings (site_title, site_description, accent, theme, imagekit_public_key, imagekit_private_key, imagekit_url_endpoint)
        VALUES (${data.siteTitle ?? "Bio Link"}, ${data.siteDescription ?? ""}, ${data.accent ?? "blue"}, ${data.theme ?? "dark"}, ${data.imagekitPublicKey ?? ""}, ${data.imagekitPrivateKey ?? ""}, ${data.imagekitUrlEndpoint ?? ""})
      `;
    } else {
      await sql`
        UPDATE site_settings SET
          site_title            = COALESCE(${data.siteTitle ?? null}, site_title),
          site_description      = COALESCE(${data.siteDescription ?? null}, site_description),
          accent                = COALESCE(${data.accent ?? null}, accent),
          theme                 = COALESCE(${data.theme ?? null}, theme),
          imagekit_public_key   = COALESCE(${data.imagekitPublicKey ?? null}, imagekit_public_key),
          imagekit_private_key  = COALESCE(${data.imagekitPrivateKey ?? null}, imagekit_private_key),
          imagekit_url_endpoint = COALESCE(${data.imagekitUrlEndpoint ?? null}, imagekit_url_endpoint)
        WHERE id = ${(existing[0] as { id: number }).id}
      `;
    }
    return { ok: true };
  });
