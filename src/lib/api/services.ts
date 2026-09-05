"use server"

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sql } from "../db";
import { getSessionFromRequest } from "./session";
import type { Service } from "../store";

function rowToService(row: Record<string, unknown>): Service {
  return {
    id: row.id as string,
    title: (row.title as string) ?? "",
    description: (row.description as string) ?? "",
    icon: (row.icon as string) ?? "Globe",
    url: (row.url as string) ?? "",
    gradientFrom: (row.gradient_from as string) ?? "#2563eb",
    gradientTo: (row.gradient_to as string) ?? "#60a5fa",
    order: (row.order as number) ?? 0,
    active: (row.active as boolean) ?? true,
  };
}

export const getServicesFn = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await sql`SELECT * FROM services ORDER BY "order"`;
  return rows.map((r) => rowToService(r as Record<string, unknown>));
});

const serviceSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  url: z.string().optional(),
  gradientFrom: z.string(),
  gradientTo: z.string(),
  order: z.number(),
  active: z.boolean(),
});

export const createServiceAction = createServerFn({ method: "POST" })
  .validator((raw: unknown) => serviceSchema.parse(raw))
  .handler(async ({ data }) => {
    const session = await getSessionFromRequest();
    if (!session) throw new Error("Unauthorized");
    await sql`
      INSERT INTO services (id, title, description, icon, url, gradient_from, gradient_to, "order", active)
      VALUES (${data.id}, ${data.title}, ${data.description}, ${data.icon}, ${data.url ?? ""}, ${data.gradientFrom}, ${data.gradientTo}, ${data.order}, ${data.active})
    `;
    return { ok: true };
  });

const partialServiceSchema = serviceSchema.partial().extend({ id: z.string() });

export const updateServiceAction = createServerFn({ method: "POST" })
  .validator((raw: unknown) => partialServiceSchema.parse(raw))
  .handler(async ({ data }) => {
    const session = await getSessionFromRequest();
    if (!session) throw new Error("Unauthorized");
    await sql`
      UPDATE services SET
        title          = COALESCE(${data.title ?? null}, title),
        description    = COALESCE(${data.description ?? null}, description),
        icon           = COALESCE(${data.icon ?? null}, icon),
        url            = COALESCE(${data.url ?? null}, url),
        gradient_from  = COALESCE(${data.gradientFrom ?? null}, gradient_from),
        gradient_to    = COALESCE(${data.gradientTo ?? null}, gradient_to),
        "order"        = COALESCE(${data.order ?? null}, "order"),
        active         = COALESCE(${data.active ?? null}, active)
      WHERE id = ${data.id}
    `;
    return { ok: true };
  });

export const deleteServiceAction = createServerFn({ method: "POST" })
  .validator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const session = await getSessionFromRequest();
    if (!session) throw new Error("Unauthorized");
    await sql`DELETE FROM services WHERE id = ${data.id}`;
    return { ok: true };
  });
