import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // ⬇️ move everything INSIDE the handler
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const { getAdminDb } = await import("@/app/lib/firebaseAdmin");
  const db = getAdminDb();

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    await db.collection("orders").add({
      stripeSessionId: session.id,
      totalAmount: session.amount_total ?? 0,
      currency: session.currency,
      createdAt: new Date(),
    });
  }

  return NextResponse.json({ received: true });
}
