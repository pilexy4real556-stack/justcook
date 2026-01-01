"use client";

import { useEffect } from "react";
import { useCart } from "@/app/lib/cart";
import Link from "next/link";

export default function SuccessPage() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    localStorage.removeItem("justcook_cart_v1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: "40px", textAlign: "center" }}>
      <h1>Payment successful 🎉</h1>
      <p>Thank you for your order. We’re preparing it now.</p>

      <Link href="/catalogue">
        <button style={{ marginTop: 20 }}>Continue shopping</button>
      </Link>
    </main>
  );
}
