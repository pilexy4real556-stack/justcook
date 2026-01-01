export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Temporary check for Stripe key
console.log("Stripe key:", process.env.STRIPE_SECRET_KEY?.startsWith("sk_test"));

export async function POST(req: Request) {
  // ⛔ Prevent execution during build
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return NextResponse.json({ success: false });
  }

  const { items, delivery, deliveryAddress, customerId, isStudent, freeDelivery, referralCode } =
    await req.json();

  if (!items || !items.length) {
    return NextResponse.json({ error: "Cart empty" }, { status: 400 });
  }

  // 1️⃣ Items total (in pounds)
  const itemsTotal = items.reduce(
    (sum: number, i: any) => sum + i.price * i.quantity,
    0
  );

  // 2️⃣ Delivery fee (in pence)
  let deliveryFeePence = delivery?.fee ?? 0;

  // 3️⃣ Apply free delivery FIRST
  if (freeDelivery) {
    deliveryFeePence = 0;
  }

  // 4️⃣ Apply referral discount
  if (referralCode) {
    deliveryFeePence = 0;
  }

  // 5️⃣ Apply student discount (15%)
  if (isStudent) {
    deliveryFeePence = Math.round(deliveryFeePence * 0.85);
  }

  // 6️⃣ Final amount in pence
  const totalAmountPence =
    Math.round(itemsTotal * 100) + deliveryFeePence;

  // Validate total amount in pence
  if (totalAmountPence < 50) {
    return NextResponse.json(
      { error: "Amount too low for Stripe" },
      { status: 400 }
    );
  }

  // 7️⃣ Stripe session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: "Groceries",
          },
          unit_amount: totalAmountPence,
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cart`,
    metadata: {
      customerId: String(customerId ?? ""),
      deliveryFee: String(deliveryFeePence),
      deliveryAddress: deliveryAddress ?? "",
      isStudent: String(isStudent),
      referralCode: referralCode ?? "",
      items: JSON.stringify(items), // ✅ REQUIRED
    },
  });

  return NextResponse.json({ url: session.url });
}

// Example of handling delivery fee with user credits
const userFreeDeliveryCredits = 0; // Replace with actual logic to fetch the value
const delivery = 5; // or from API
let deliveryFee = delivery;

if (userFreeDeliveryCredits > 0) {
  deliveryFee = 0;
}

const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/checkout`, {
  method: "POST",
  body: JSON.stringify({
    deliveryFee,
  }),
}).catch((error) => {
  console.error("Fetch failed:", error);
});
