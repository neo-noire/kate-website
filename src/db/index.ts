import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Neon's pooled connection string (added by the Vercel Neon integration). The pool connects
// lazily, so building without a database works; the first query needs DATABASE_URL.
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

export const db = drizzle(pool, { schema });
