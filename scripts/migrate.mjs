// Applies pending SQL migrations from ./drizzle before `next build`.
// On Vercel only the production build migrates (preview builds must not change the database a
// branch happens to point at). Locally it runs when DATABASE_URL is set; `next build` itself
// still needs a database to prerender the catalog pages.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (process.env.VERCEL && process.env.VERCEL_ENV !== "production") {
  console.log(`Skipping database migrations on a ${process.env.VERCEL_ENV ?? "non-production"} build.`);
  process.exit(0);
}
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
