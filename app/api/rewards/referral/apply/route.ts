import { NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { referralCode, newUserUid } = await req.json();

    if (!referralCode || !newUserUid) {
      return NextResponse.json(
        { error: "Missing referralCode or newUserUid" },
        { status: 400 }
      );
    }

    // Find the referrer
    const snapshot = await adminDb
      .collection("users")
      .where("referralCode", "==", referralCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 404 }
      );
    }

    const referrerDoc = snapshot.docs[0];

    // Increment free delivery credits
    await referrerDoc.ref.update({
      freeDeliveryCredits:
        (referrerDoc.data().freeDeliveryCredits || 0) + 1,
    });

    // Mark new user as referred
    await adminDb.collection("users").doc(newUserUid).set(
      {
        referredBy: referrerDoc.id,
        referredAt: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: "Referral applied successfully",
    });
  } catch (error) {
    console.error("Referral apply error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
