import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db";
import { stripeEvent } from "@/db/schema";
import { releaseBySession } from "@/lib/promo";
import { fulfillCheckoutSession, getStripe, restoreDisputedPayment, revokePayment } from "@/lib/stripe/server";

/**
 * Stripe webhook: gives access when a checkout is paid and takes it away when the payment is
 * refunded or disputed. Add this URL in Stripe (Developers, Webhooks) with the events below.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(await request.text(), signature, secret);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Stripe delivers at least once; an event already recorded was already handled.
  const [fresh] = await db
    .insert(stripeEvent)
    .values({ id: event.id, type: event.type })
    .onConflictDoNothing()
    .returning({ id: stripeEvent.id });
  if (!fresh) return Response.json({ received: true, duplicate: true });

  try {
    await handle(event);
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      // The course or user no longer exists; retrying can't help. Keep the event recorded.
      console.error(`Stripe event ${event.id} (${event.type}) refers to a deleted row`, error);
      return Response.json({ received: true, ignored: true });
    }
    // Forget the event so Stripe's retry gets another go.
    await db.delete(stripeEvent).where(eq(stripeEvent.id, event.id));
    console.error(`Stripe event ${event.id} (${event.type}) failed`, error);
    return Response.json({ error: "Handler failed" }, { status: 500 });
  }
  return Response.json({ received: true });
}

async function handle(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await fulfillCheckoutSession(event.data.object);
      await deleteSessionCoupon(event.data.object);
      break;
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      await releaseBySession(event.data.object.id);
      await deleteSessionCoupon(event.data.object);
      break;
    case "charge.refunded": {
      const charge = event.data.object;
      if (charge.refunded) await revokePayment(paymentIntentId(charge.payment_intent), "refunded");
      break;
    }
    case "charge.dispute.created":
      await revokePayment(paymentIntentId(event.data.object.payment_intent), "disputed");
      break;
    case "charge.dispute.closed":
      if (event.data.object.status === "won") await restoreDisputedPayment(paymentIntentId(event.data.object.payment_intent));
      break;
    default:
      console.info(`Stripe event ${event.type} ignored`);
  }
}

function paymentIntentId(value: string | Stripe.PaymentIntent | null): string {
  return (typeof value === "string" ? value : value?.id) ?? "";
}

/** Promo checkouts create a one-off Stripe coupon; once the session is over it has no further use. */
async function deleteSessionCoupon(session: Stripe.Checkout.Session) {
  for (const discount of session.discounts ?? []) {
    const coupon = typeof discount.coupon === "string" ? discount.coupon : discount.coupon?.id;
    if (coupon) await getStripe().coupons.del(coupon).catch(() => undefined);
  }
}

function isForeignKeyViolation(error: unknown) {
  const code = (error as { cause?: { code?: string } })?.cause?.code ?? (error as { code?: string })?.code;
  return code === "23503";
}

