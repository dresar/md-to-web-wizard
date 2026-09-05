import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://user:password@localhost:5432/dbname";

export const sql = neon(DATABASE_URL);
