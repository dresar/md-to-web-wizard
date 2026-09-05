"use server"

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sql } from "../db";
import { getSessionFromRequest } from "./session";
import type { Product } from "../store";

function rowToProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    title: (row.title as string) ?? "",
    description: (row.description as string) ?? "",
    price: (row.price as number) ?? 0,
    discountPrice: row.discount_price != null ? (row.discount_price as number) : undefined,
    primaryUrl: (row.primary_url as string) ?? "",
    primaryLabel: (row.primary_label as string) ?? "Beli Sekarang",
    secondaryUrl: row.secondary_url != null ? (row.secondary_url as string) : undefined,
    secondaryLabel: row.secondary_label != null ? (row.secondary_label as string) : undefined,
    mainImage: (row.main_image as string) ?? "",
    gallery: (row.gallery as string[]) ?? [],
    active: (row.active as boolean) ?? true,
  };
}

export const getProductsFn = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await sql`SELECT * FROM products ORDER BY title`;
  return rows.map((r) => rowToProduct(r as Record<string, unknown>));
});

const productSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  price: z.number(),
  discountPrice: z.number().optional(),
  primaryUrl: z.string(),
  primaryLabel: z.string(),
  secondaryUrl: z.string().optional(),
  secondaryLabel: z.string().optional(),
  mainImage: z.string(),
  gallery: z.array(z.string()),
  active: z.boolean(),
});

export const createProductAction = createServerFn({ method: "POST" })
  .validator((raw: unknown) => productSchema.parse(raw))
  .handler(async ({ data }) => {
    const session = await getSessionFromRequest();
    if (!session) throw new Error("Unauthorized");

    await sql`
      INSERT INTO products (id, title, description, price, discount_price, primary_url, primary_label, secondary_url, secondary_label, main_image, gallery, active)
      VALUES (
        ${data.id}, ${data.title}, ${data.description}, ${data.price},
        ${data.discountPrice ?? null}, ${data.primaryUrl}, ${data.primaryLabel},
        ${data.secondaryUrl ?? null}, ${data.secondaryLabel ?? null},
        ${data.mainImage}, ${JSON.stringify(data.gallery)}, ${data.active}
      )
    `;
    return { ok: true };
  });

const partialProductSchema = productSchema.partial().extend({ id: z.string() });

export const updateProductAction = createServerFn({ method: "POST" })
  .validator((raw: unknown) => partialProductSchema.parse(raw))
  .handler(async ({ data }) => {
    const session = await getSessionFromRequest();
    if (!session) throw new Error("Unauthorized");

    await sql`
      UPDATE products SET
        title           = COALESCE(${data.title ?? null}, title),
        description     = COALESCE(${data.description ?? null}, description),
        price           = COALESCE(${data.price ?? null}, price),
        discount_price  = ${data.discountPrice !== undefined ? (data.discountPrice ?? null) : sql`discount_price`},
        primary_url     = COALESCE(${data.primaryUrl ?? null}, primary_url),
        primary_label   = COALESCE(${data.primaryLabel ?? null}, primary_label),
        secondary_url   = ${data.secondaryUrl !== undefined ? (data.secondaryUrl ?? null) : sql`secondary_url`},
        secondary_label = ${data.secondaryLabel !== undefined ? (data.secondaryLabel ?? null) : sql`secondary_label`},
        main_image      = COALESCE(${data.mainImage ?? null}, main_image),
        gallery         = COALESCE(${data.gallery ? JSON.stringify(data.gallery) : null}::jsonb, gallery),
        active          = COALESCE(${data.active ?? null}, active)
      WHERE id = ${data.id}
    `;
    return { ok: true };
  });

export const deleteProductAction = createServerFn({ method: "POST" })
  .validator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const session = await getSessionFromRequest();
    if (!session) throw new Error("Unauthorized");
    await sql`DELETE FROM products WHERE id = ${data.id}`;
    return { ok: true };
  });
