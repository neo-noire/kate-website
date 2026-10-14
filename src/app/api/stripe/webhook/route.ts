import type Stripe from "stripe";
import { fulfillCheckoutSession, getStripe, revokeRefundedPayment } from "@/lib/stripe/server";

/**
 * Stripe webhook: gives access when a checkout is paid and takes it away when the payment is
 * fully refunded. Add this URL in Stripe (Developers, Webhooks) with the events below.
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

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await fulfillCheckoutSession(event.data.object);
      break;
    case "charge.refunded": {
      const charge = event.data.object;
      const paymentIntent = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      if (charge.refunded && paymentIntent) await revokeRefundedPayment(paymentIntent);
      break;
    }
  }
  return Response.json({ received: true });
}
