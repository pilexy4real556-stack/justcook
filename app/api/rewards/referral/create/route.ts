import { NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebaseAdmin";

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return "REF-" + Array.from({ length: 6 })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
}

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json(
        { ok: false, error: "UID_REQUIRED" },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection("users").doc(uid);
    const snapshot = await userRef.get();

    // If user already has a referral code, return it
    if (snapshot.exists && snapshot.data()?.referralCode) {
      return NextResponse.json({
        ok: true,
        code: snapshot.data()?.referralCode,
      });
    }

    // Otherwise create one
    const code = generateCode();

    await userRef.set(
      {
        referralCode: code,
        freeDeliveryCredits: 0,
        createdAt: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, code });
  } catch (err) {
    console.error("Referral error:", err);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
