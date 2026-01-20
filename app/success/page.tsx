"use client";

import { useEffect, useState } from "react";
import { getOrCreateCustomerId } from "@/app/lib/customerId";
import { db } from "@/app/lib/firebaseClient";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useCart } from "@/app/lib/cart";
import Link from "next/link";

export default function SuccessPage() {
  const { clearCart } = useCart();
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [isFirstOrder, setIsFirstOrder] = useState(false);

  useEffect(() => {
    clearCart();
    localStorage.removeItem("justcook_cart_v1");

    const loadReferral = async () => {
      const id = await getOrCreateCustomerId();
      if (!id) {
        setLoading(false);
        return;
      }

      // Check if this is first order
      const ordersQuery = query(
        collection(db, "orders"),
        where("customerId", "==", id),
      );
      const ordersSnap = await getDocs(ordersQuery);
      const firstOrder = ordersSnap.size === 1;
      console.log("firstOrder", firstOrder, ordersSnap.size);
      setIsFirstOrder(firstOrder);

      // Load referral code (should already exist if first order)
      const snap = await getDoc(doc(db, "users", id));
      if (snap.exists()) {
        setReferralCode(snap.data().referralCode ?? "");
      }

      setLoading(false);
    };

    loadReferral();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return null;

  return (
    <main
      style={{
        padding: 32,
        textAlign: "center",
        maxWidth: 420,
        margin: "0 auto",
      }}
    >
      <h1>Payment successful</h1>
      <p>Your order is confirmed and being prepared.</p>

      {isFirstOrder && referralCode && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 12,
            background: "#f7f7f7",
          }}
        >
          <p style={{ fontWeight: 600 }}>Your referral code</p>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{referralCode}</div>
          <p style={{ fontSize: 13, marginTop: 8 }}>
            Share this to give friends free delivery.
          </p>
        </div>
      )}

      <Link href="/catalogue">
        <button style={{ marginTop: 32 }}>Continue shopping</button>
      </Link>
    </main>
  );
}
