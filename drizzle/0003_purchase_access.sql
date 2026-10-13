ALTER TABLE "purchase" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "purchase" ADD COLUMN "first_watched_at" timestamp with time zone;--> statement-breakpoint
-- Purchases made before access limits existed get the standard 3 months from their purchase date.
UPDATE "purchase" SET "expires_at" = "created_at" + interval '3 months' WHERE "expires_at" IS NULL;
