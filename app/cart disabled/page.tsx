"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/app/lib/cart";

export default function CartPage() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();

  if (items.length === 0) {
    return <p>Your cart is empty.</p>;
  }

  return (
    <div className="cart-container">
      <h2>Your Cart</h2>

      <div className="cart-list">
        {items.map((item) => (
          <div key={item.id} className="cart-row">
            <span>{item.name}</span>
            <span>
              £{item.price} × {item.quantity}
            </span>
          </div>
        ))}
      </div>

      <div className="cart-footer">
        <span>Total: £{totalPrice.toFixed(2)}</span>
        <button onClick={clearCart}>Clear Cart</button>
        <button onClick={() => router.push("/checkout")}>Checkout</button>
      </div>
    </div>
  );
}