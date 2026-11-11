CREATE TABLE "rate_limit" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stripe_event" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "newsletter_subscriber" ADD COLUMN "consent_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "newsletter_subscriber" ADD COLUMN "consent_text" text;--> statement-breakpoint
ALTER TABLE "newsletter_subscriber" ADD COLUMN "ip_address" text;--> statement-breakpoint
ALTER TABLE "purchase" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
-- Subscribers who signed up before consent was recorded ticked the same box when they signed up.
UPDATE "newsletter_subscriber" SET "consent_at" = "created_at";
