import { NextResponse } from "next/server";
import { getAdminDb } from "@/app/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getUserByReferralCode(referralCode: string) {
  const db = getAdminDb();

  const snap = await db
    .collection("users")
    .where("referralCode", "==", referralCode)
    .limit(1)
    .get();

  if (snap.empty) return null;

  return snap.docs[0];
}

export async function POST(req: Request) {
  // ✅ Prevent execution during build
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return NextResponse.json({ ok: false });
  }

  const { referralCode } = await req.json();

  if (!referralCode) {
    return NextResponse.json({ ok: false });
  }

  const refDoc = await getUserByReferralCode(referralCode);
  if (!refDoc) {
    return NextResponse.json({ ok: false });
  }

  const db = getAdminDb();

  await db.collection("users").doc(refDoc.id).update({
    freeDeliveryCredits: FieldValue.increment(1),
  });

  return NextResponse.json({ ok: true });
}
