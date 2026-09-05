"use server";

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import ImageKit from "imagekit";
import { sql } from "../db";
import { getSessionFromRequest } from "./session";

// Helper to initialize ImageKit by reading database settings first, then falling back to .env
async function getIKClient() {
  const settingsRows = await sql`SELECT imagekit_public_key, imagekit_private_key, imagekit_url_endpoint FROM site_settings LIMIT 1`;
  
  let publicKey = process.env.IMAGEKIT_PUBLIC_KEY || "";
  let privateKey = process.env.IMAGEKIT_PRIVATE_KEY || "";
  let urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || "";

  if (settingsRows.length) {
    const row = settingsRows[0] as {
      imagekit_public_key?: string;
      imagekit_private_key?: string;
      imagekit_url_endpoint?: string;
    };
    if (row.imagekit_public_key) publicKey = row.imagekit_public_key;
    if (row.imagekit_private_key) privateKey = row.imagekit_private_key;
    if (row.imagekit_url_endpoint) urlEndpoint = row.imagekit_url_endpoint;
  }

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new Error(
      "ImageKit belum dikonfigurasi. Silakan atur Kredensial ImageKit di halaman Pengaturan Admin atau file .env."
    );
  }

  return new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint,
  });
}

// ─── API: Upload Image ──────────────────────────────────────────────────────────

const uploadSchema = z.object({
  base64File: z.string(), // base64 data URL
  fileName: z.string(),
  fileSize: z.number(),
});

export const uploadMediaFn = createServerFn({ method: "POST" })
  .validator((raw: unknown) => uploadSchema.parse(raw))
  .handler(async ({ data }) => {
    const session = await getSessionFromRequest();
    if (!session) throw new Error("Unauthorized");

    try {
      const ik = await getIKClient();

      // Extract the raw base64 string if it contains the data:image/*;base64 prefix
      let fileData = data.base64File;
      if (fileData.includes(";base64,")) {
        fileData = fileData.split(";base64,").pop() || "";
      }

      // Upload to ImageKit
      const ikResult = await new Promise<any>((resolve, reject) => {
        ik.upload(
          {
            file: fileData,
            fileName: data.fileName,
            folder: "/md-to-web-wizard",
          },
          (err, res) => {
            if (err) reject(err);
            else resolve(res);
          }
        );
      });

      // Save metadata in database
      const rows = await sql`
        INSERT INTO uploaded_images (file_id, name, url, size)
        VALUES (${ikResult.fileId}, ${ikResult.name}, ${ikResult.url}, ${data.fileSize})
        RETURNING id, file_id as "fileId", name, url, size, created_at as "createdAt"
      `;

      return { ok: true, data: rows[0] };
    } catch (error: any) {
      console.error("ImageKit upload error:", error);
      return { ok: false, error: error.message || "Gagal mengunggah gambar." };
    }
  });

// ─── API: List Images ────────────────────────────────────────────────────────────

export const getMediaListFn = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSessionFromRequest();
  if (!session) throw new Error("Unauthorized");

  const rows = await sql`
    SELECT id, file_id as "fileId", name, url, size, created_at as "createdAt"
    FROM uploaded_images
    ORDER BY created_at DESC
  `;
  return rows;
});

// ─── API: Delete Image ──────────────────────────────────────────────────────────

const deleteSchema = z.object({
  id: z.number(),
});

export const deleteMediaFn = createServerFn({ method: "POST" })
  .validator((raw: unknown) => deleteSchema.parse(raw))
  .handler(async ({ data }) => {
    const session = await getSessionFromRequest();
    if (!session) throw new Error("Unauthorized");

    try {
      const ik = await getIKClient();

      // Get the file details from the database
      const rows = await sql`SELECT file_id FROM uploaded_images WHERE id = ${data.id} LIMIT 1`;
      if (!rows.length) {
        return { ok: false, error: "Gambar tidak ditemukan di database." };
      }

      const fileId = (rows[0] as { file_id: string }).file_id;

      // Delete from ImageKit
      try {
        await new Promise<void>((resolve, reject) => {
          ik.deleteFile(fileId, (err) => {
            if (err) {
              // If the file is already deleted in ImageKit, we should still allow deleting from DB
              if (err.message && err.message.includes("not found")) {
                resolve();
              } else {
                reject(err);
              }
            } else {
              resolve();
            }
          });
        });
      } catch (ikErr: any) {
        console.warn("ImageKit deletion warning (might not exist):", ikErr);
      }

      // Delete from database
      await sql`DELETE FROM uploaded_images WHERE id = ${data.id}`;

      return { ok: true };
    } catch (error: any) {
      console.error("ImageKit delete error:", error);
      return { ok: false, error: error.message || "Gagal menghapus gambar." };
    }
  });
