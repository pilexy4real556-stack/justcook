import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   Generate referral code ONCE
========================= */
async function ensureReferralCode(customerId: string, db: any) {
  const userRef = db.collection("users").doc(customerId);
  const snap = await userRef.get();

  if (!snap.exists) {
    console.warn("⚠️ User not found for referral:", customerId);
    return null;
  }

  const data = snap.data();

  // Do NOT regenerate
  if (data.referralCode) {
    console.log("ℹ️ Referral already exists:", data.referralCode);
    return data.referralCode;
  }

  const referralCode =
    "JC-" + Math.random().toString(36).substring(2, 7).toUpperCase();

  await userRef.update({
    referralCode,
    referralCreatedAt: new Date(),
  });

  console.log("✅ Referral code generated:", referralCode);
  return referralCode;
}

export async function POST(req: NextRequest) {
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

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("🔔 Webhook received: checkout.session.completed");
      console.log("📦 Session metadata:", session.metadata);

      const customerId = session.metadata?.customerId;
      const usedReferralCode = session.metadata?.referralCode ?? null;

      if (!customerId) {
        console.error("❌ Missing customerId in Stripe metadata");
        console.error("📦 Available metadata:", session.metadata);
        return NextResponse.json({ received: true });
      }

      console.log("✅ Processing order for customer:", customerId);

      /* -------------------------
         Create order
      ------------------------- */
      const orderData: any = {
        customerId,
        paymentStatus: "PAID",
        orderStatus: "PAID",
        stripeSessionId: session.id,
        totalAmount: session.amount_total ?? 0,
        currency: session.currency,
        createdAt: new Date(),
      };

      // Store referral info in order if used
      const referrerId = session.metadata?.referrerId ?? null;
      if (usedReferralCode && referrerId) {
        orderData.referralCodeUsed = usedReferralCode;
        orderData.referrerId = referrerId;
      }

      const orderRef = await db.collection("orders").add(orderData);
      console.log("✅ Order created:", orderRef.id, "for customer:", customerId);

      /* -------------------------
         Apply referral (if used) - ONLY if not already applied
      ------------------------- */
      if (usedReferralCode && referrerId) {
        const userSnap = await db.collection("users").doc(customerId).get();
        const userData = userSnap.data();

        // Only apply if user hasn't been referred yet
        if (!userData?.referredBy) {
          const referrerSnap = await db
            .collection("users")
            .doc(referrerId)
            .get();
          const referrerData = referrerSnap.data();

          // Check if code hasn't been used yet
          if (!referrerData?.referralCodeUsed) {
            // Mark code as used
            await db.collection("users").doc(referrerId).update({
              referralCodeUsed: true,
              referralCodeUsedBy: customerId,
              referralCodeUsedAt: new Date(),
            });

            // Mark user as referred (but DON'T give them free delivery credit)
            await db.collection("users").doc(customerId).update({
              referredBy: referrerId,
              referralUsedAt: new Date(),
            });

            // Give referrer free delivery credit for NEXT order
            await db.collection("users").doc(referrerId).update({
              freeDeliveryCredits: (referrerData?.freeDeliveryCredits || 0) + 1,
            });

            console.log("🎉 Referral applied:", usedReferralCode);
            console.log("✅ Referrer gets free delivery credit for next order");
          }
        }
      }

      /* -------------------------
         Ensure referral code for payer (fallback - code should already exist from checkout)
      ------------------------- */
      // Code should already be generated at checkout, but ensure it exists as fallback
      await ensureReferralCode(customerId, db);

      /* -------------------------
         Consume free delivery credit
      ------------------------- */
      const userSnap = await db.collection("users").doc(customerId).get();
      const user = userSnap.data();

      if (user?.freeDeliveryCredits > 0) {
        await db.collection("users").doc(customerId).update({
          freeDeliveryCredits: user.freeDeliveryCredits - 1,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("❌ Webhook processing failed:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
