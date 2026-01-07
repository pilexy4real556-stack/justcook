"use client";

import Link from "next/link";
import { useCart } from "@/app/lib/cart";
import { useEffect, useState } from "react";
import styles from "./Header.module.css";

export default function Header() {
  const { items } = useCart();
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Clear cart if payment was successful
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("session_id")) {
      localStorage.removeItem("cart");
    }
  }, []);

  console.log("HEADER CART ITEMS", items);

  if (!mounted) return null;

  return (
    <header className="app-header">
      <Link href="/catalogue" className="app-title">
        JustCook
      </Link>

      <div className="header-actions">
        <Link href="/cart" className="cart-fab">
          <div className="cartWrapper">
            <img src="/images/cart.png" className="cartIcon" />
          </div>

          {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
        </Link>

        <a href="/orders" className="myOrdersBtn">
          My Orders
        </a>
      </div>
    </header>
  );
}
