"use server"

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sql } from "../db";
import { getSessionFromRequest } from "./session";
import type { WhatsAppTemplate } from "../store";

function rowToTemplate(row: Record<string, unknown>): WhatsAppTemplate {
  return {
    id: row.id as string,
    category: (row.category as string) ?? "",
    title: (row.title as string) ?? "",
    message: (row.message as string) ?? "",
  };
}

export const getTemplatesFn = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await sql`SELECT * FROM whatsapp_templates ORDER BY category, title`;
  return rows.map((r) => rowToTemplate(r as Record<string, unknown>));
});

const templateSchema = z.object({
  id: z.string(),
  category: z.string(),
  title: z.string(),
  message: z.string(),
});

export const createTemplateAction = createServerFn({ method: "POST" })
  .validator((raw: unknown) => templateSchema.parse(raw))
  .handler(async ({ data }) => {
    const session = await getSessionFromRequest();
    if (!session) throw new Error("Unauthorized");
    await sql`
      INSERT INTO whatsapp_templates (id, category, title, message)
      VALUES (${data.id}, ${data.category}, ${data.title}, ${data.message})
    `;
    return { ok: true };
  });

const partialTemplateSchema = templateSchema.partial().extend({ id: z.string() });

export const updateTemplateAction = createServerFn({ method: "POST" })
  .validator((raw: unknown) => partialTemplateSchema.parse(raw))
  .handler(async ({ data }) => {
    const session = await getSessionFromRequest();
    if (!session) throw new Error("Unauthorized");
    await sql`
      UPDATE whatsapp_templates SET
        category = COALESCE(${data.category ?? null}, category),
        title    = COALESCE(${data.title ?? null}, title),
        message  = COALESCE(${data.message ?? null}, message)
      WHERE id = ${data.id}
    `;
    return { ok: true };
  });

export const deleteTemplateAction = createServerFn({ method: "POST" })
  .validator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const session = await getSessionFromRequest();
    if (!session) throw new Error("Unauthorized");
    await sql`DELETE FROM whatsapp_templates WHERE id = ${data.id}`;
    return { ok: true };
  });
