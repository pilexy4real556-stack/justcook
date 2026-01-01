import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminDb } from "@/app/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
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
    console.error("Webhook verification failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const items = session.metadata?.items
      ? JSON.parse(session.metadata.items)
      : [];

    const deliveryFee = Number(session.metadata?.deliveryFee ?? 0);
    const deliveryBand = session.metadata?.deliveryBand ?? "";
    const deliveryAddress = session.metadata?.deliveryAddress ?? "";
    const customerId = session.metadata?.customerId ?? "";

    const itemsTotal = items.reduce(
      (sum: number, i: any) => sum + i.subtotal,
      0
    );

    await db.collection("orders").add({
      customerId,
      stripeSessionId: session.id,
      items,
      itemsTotal,
      deliveryFee,
      deliveryBand,
      deliveryAddress,
      totalAmount: session.amount_total ?? 0,
      currency: session.currency,
      paymentStatus: "PAID",
      orderStatus: "PAID",
      createdAt: new Date(),
    });

    console.log("Order created for session:", session.id);
  }

  return NextResponse.json({ received: true });
}
