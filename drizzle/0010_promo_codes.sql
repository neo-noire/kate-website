CREATE TABLE "promo_code" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"percent_off" integer,
	"amount_off_cents" integer,
	"currency" text,
	"starts_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"max_redemptions" integer,
	"per_user_limit" integer DEFAULT 1 NOT NULL,
	"all_programs" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promo_code_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "promo_code_program" (
	"promo_code_id" text NOT NULL,
	"program_id" text NOT NULL,
	CONSTRAINT "promo_code_program_promo_code_id_program_id_pk" PRIMARY KEY("promo_code_id","program_id")
);
--> statement-breakpoint
CREATE TABLE "promo_redemption" (
	"id" text PRIMARY KEY NOT NULL,
	"promo_code_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"checkout_session_id" text,
	"status" text DEFAULT 'reserved' NOT NULL,
	"discount_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promo_redemption_checkout_session_id_unique" UNIQUE("checkout_session_id")
);
--> statement-breakpoint
ALTER TABLE "promo_code_program" ADD CONSTRAINT "promo_code_program_promo_code_id_promo_code_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_code"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_program" ADD CONSTRAINT "promo_code_program_program_id_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."program"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_redemption" ADD CONSTRAINT "promo_redemption_promo_code_id_promo_code_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_code"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_redemption" ADD CONSTRAINT "promo_redemption_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_redemption" ADD CONSTRAINT "promo_redemption_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "promo_redemption_code_idx" ON "promo_redemption" USING btree ("promo_code_id");--> statement-breakpoint
CREATE INDEX "promo_redemption_user_idx" ON "promo_redemption" USING btree ("user_id");