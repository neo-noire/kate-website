ALTER TABLE "program" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;
--> statement-breakpoint
UPDATE "program" SET "status" = CASE WHEN "published" THEN 'published' ELSE 'draft' END;
