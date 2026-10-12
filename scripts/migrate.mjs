// Applies pending SQL migrations from ./drizzle before `next build`.
// On Vercel a missing database fails the build; locally it is skipped so the site still builds.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  if (process.env.VERCEL) {
    console.error("DATABASE_URL is not set. Connect the Neon database to this Vercel project.");
    process.exit(1);
  }
  console.warn("DATABASE_URL is not set; skipping database migrations.");
  process.exit(0);
}

const pool = new pg.Pool({ connectionString: url, max: 1 });
try {
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  console.log("Database migrations applied.");
} finally {
  await pool.end();
}
