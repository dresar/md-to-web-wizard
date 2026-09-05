import { sql } from "./db";
import bcrypt from "bcryptjs";

export async function runMigrations() {
  // Check if users table already exists to avoid repeated migration attempts
  const check = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'users'
    );
  `;
  if (check[0]?.exists) {
    // Migration already ran, but we allow it to proceed to seed dummy data if missing
  }

  // 1. users
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      username    TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT ''`;

  // 2. profiles
  await sql`
    CREATE TABLE IF NOT EXISTS profiles (
      id                SERIAL PRIMARY KEY,
      name              TEXT NOT NULL DEFAULT '',
      title             TEXT NOT NULL DEFAULT '',
      description       TEXT NOT NULL DEFAULT '',
      avatar_url        TEXT NOT NULL DEFAULT '',
      verified          BOOLEAN NOT NULL DEFAULT FALSE,
      whatsapp_number   TEXT NOT NULL DEFAULT '',
      slug              TEXT NOT NULL DEFAULT ''
    )
  `;

  // 3. social_links
  await sql`
    CREATE TABLE IF NOT EXISTS social_links (
      id      TEXT PRIMARY KEY,
      label   TEXT NOT NULL DEFAULT '',
      url     TEXT NOT NULL DEFAULT '',
      icon    TEXT NOT NULL DEFAULT 'Globe',
      "order" INTEGER NOT NULL DEFAULT 0
    )
  `;

  // 4. services
  await sql`
    CREATE TABLE IF NOT EXISTS services (
      id             TEXT PRIMARY KEY,
      title          TEXT NOT NULL DEFAULT '',
      description    TEXT NOT NULL DEFAULT '',
      icon           TEXT NOT NULL DEFAULT 'Globe',
      url            TEXT NOT NULL DEFAULT '',
      gradient_from  TEXT NOT NULL DEFAULT '#2563eb',
      gradient_to    TEXT NOT NULL DEFAULT '#60a5fa',
      "order"        INTEGER NOT NULL DEFAULT 0,
      active         BOOLEAN NOT NULL DEFAULT TRUE
    )
  `;

  // 5. products
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id              TEXT PRIMARY KEY,
      title           TEXT NOT NULL DEFAULT '',
      description     TEXT NOT NULL DEFAULT '',
      price           INTEGER NOT NULL DEFAULT 0,
      discount_price  INTEGER,
      primary_url     TEXT NOT NULL DEFAULT '',
      primary_label   TEXT NOT NULL DEFAULT 'Beli Sekarang',
      secondary_url   TEXT,
      secondary_label TEXT,
      main_image      TEXT NOT NULL DEFAULT '',
      gallery         JSONB NOT NULL DEFAULT '[]',
      active          BOOLEAN NOT NULL DEFAULT TRUE
    )
  `;

  // 6. whatsapp_templates
  await sql`
    CREATE TABLE IF NOT EXISTS whatsapp_templates (
      id       TEXT PRIMARY KEY,
      category TEXT NOT NULL DEFAULT '',
      title    TEXT NOT NULL DEFAULT '',
      message  TEXT NOT NULL DEFAULT ''
    )
  `;

  // 7. site_settings (single-row)
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      id                SERIAL PRIMARY KEY,
      site_title        TEXT NOT NULL DEFAULT 'Bio Link',
      site_description  TEXT NOT NULL DEFAULT '',
      accent            TEXT NOT NULL DEFAULT 'blue',
      theme             TEXT NOT NULL DEFAULT 'dark'
    )
  `;

  // Migrations for site_settings ImageKit columns if not exists
  await sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS imagekit_public_key TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS imagekit_private_key TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS imagekit_url_endpoint TEXT NOT NULL DEFAULT ''`;

  // 8. uploaded_images
  await sql`
    CREATE TABLE IF NOT EXISTS uploaded_images (
      id         SERIAL PRIMARY KEY,
      file_id    TEXT NOT NULL UNIQUE,
      name       TEXT NOT NULL,
      url        TEXT NOT NULL,
      size       INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Seed admin user if not exists
  const [existingAdmin] = await sql`SELECT id FROM users WHERE username = 'admin'`;
  if (!existingAdmin) {
    const hash = await bcrypt.hash("admin123", 10);
    await sql`INSERT INTO users (username, password_hash) VALUES ('admin', ${hash})`;
  }

  // Seed profile if empty
  const [existingProfile] = await sql`SELECT id FROM profiles LIMIT 1`;
  if (!existingProfile) {
    await sql`
      INSERT INTO profiles (name, title, description, avatar_url, verified, whatsapp_number, slug)
      VALUES (
        'Admin',
        'Administrator',
        'Selamat datang di halaman resmi saya.',
        'https://api.dicebear.com/9.x/avataaars/svg?seed=Admin&backgroundColor=b6e3f4',
        true,
        '',
        'admin'
      )
    `;
  }

  // Seed site_settings if empty
  const [existingSettings] = await sql`SELECT id FROM site_settings LIMIT 1`;
  if (!existingSettings) {
    await sql`
      INSERT INTO site_settings (site_title, site_description, accent, theme)
      VALUES ('Bio Link', 'Semua link penting dalam satu tempat', 'blue', 'dark')
    `;
  }

  console.log("✅ Database tables and schema verified");
}
