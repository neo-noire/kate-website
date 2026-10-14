ALTER TABLE "purchase" ADD COLUMN "stripe_checkout_session_id" text;--> statement-breakpoint
ALTER TABLE "purchase" ADD COLUMN "stripe_payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "purchase" ADD COLUMN "amount_cents" integer;--> statement-breakpoint
ALTER TABLE "purchase" ADD COLUMN "tax_cents" integer;--> statement-breakpoint
ALTER TABLE "purchase" ADD COLUMN "currency" text;--> statement-breakpoint
CREATE INDEX "purchase_payment_intent_idx" ON "purchase" USING btree ("stripe_payment_intent_id");