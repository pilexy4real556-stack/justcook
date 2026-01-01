import { db } from "@/app/lib/firebaseClient";
import { doc, getDoc, setDoc } from "firebase/firestore";

function generateCode() {
  return "REF-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function getOrCreateReferralCode(customerId: string) {
  const ref = doc(db, "users", customerId);
  const snap = await getDoc(ref);

  if (snap.exists() && snap.data()?.referralCode) {
    return snap.data().referralCode;
  }

  const code = generateCode();

  await setDoc(ref, {
    referralCode: code,
    createdAt: Date.now(),
  }, { merge: true });

  return code;
}