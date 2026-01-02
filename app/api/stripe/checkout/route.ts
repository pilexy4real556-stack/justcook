import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

export async function POST(req: Request) {
  try {
    const { items, deliveryFeePence } = await req.json();

    console.log("Received payload:", { items, deliveryFeePence });

    // Hardcoded values for testing
    const testItems = [
      { name: "Sample Item", price: 5.99, quantity: 1 },
    ];
    const testDeliveryFeePence = 299;

    // Hardcoded delivery information for testing
    const delivery = { fee: 299, description: "Standard Delivery" };
    console.log("Hardcoded Delivery:", delivery);

    const lineItems = items.map((item) => {
      const price = Number(item.price);

      if (!Number.isFinite(price)) {
        throw new Error(`Invalid price for item: ${item.name}`);
      }

      return {
        price_data: {
          currency: "gbp",
          product_data: { name: item.name },
          unit_amount: Math.round(price * 100),
        },
        quantity: item.quantity,
      };
    });

    lineItems.push({
      price_data: {
        currency: "gbp",
        product_data: { name: delivery.description },
        unit_amount: delivery.fee, // Use the hardcoded delivery fee
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return NextResponse.json(
      { error: "Stripe checkout failed" },
      { status: 500 }
    );
  }
}
