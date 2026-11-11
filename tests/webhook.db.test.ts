/** The Stripe webhook route: signature check and duplicate delivery. Needs DATABASE_URL (migrated). */
import Stripe from "stripe";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;

describe.skipIf(!url)("stripe webhook", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_unit";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_unit";
  const { POST } = await import("@/app/api/stripe/webhook/route");
  const { db } = await import("@/db");
  const { stripeEvent } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const stripe = new Stripe("sk_test_unit");

  const event = {
    id: "evt_test_dup",
    object: "event",
    type: "checkout.session.expired",
    data: { object: { id: "cs_test_none", object: "checkout.session", discounts: [] } },
  };

  function signed(payload: string) {
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_unit" });
    return new Request("http://localhost/api/stripe/webhook", { method: "POST", body: payload, headers: { "stripe-signature": signature } });
  }

  beforeAll(async () => {
    await db.delete(stripeEvent).where(eq(stripeEvent.id, event.id));
  });
  afterAll(async () => {
    await db.delete(stripeEvent).where(eq(stripeEvent.id, event.id));
    await db.$client.end();
  });

  it("rejects missing and bad signatures", async () => {
    const noSig = await POST(new Request("http://localhost/api/stripe/webhook", { method: "POST", body: "{}" }));
    expect(noSig.status).toBe(400);
    const bad = await POST(
      new Request("http://localhost/api/stripe/webhook", { method: "POST", body: "{}", headers: { "stripe-signature": "t=1,v1=nope" } }),
    );
    expect(bad.status).toBe(400);
  });

  it("handles an event once and acknowledges redeliveries", async () => {
    const first = await POST(signed(JSON.stringify(event)));
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ received: true });
    const second = await POST(signed(JSON.stringify(event)));
    expect(await second.json()).toEqual({ received: true, duplicate: true });
  });
});
