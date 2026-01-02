"use client";

import { useCart } from "@/app/lib/cart";
import { db } from "@/app/lib/firebaseClient";
import { getOrCreateCustomerId } from "@/app/lib/customerId";
import { collection, doc, getDocs, getDoc, limit, orderBy, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDeliveryBand } from "../../lib/delivery";

export default function CartPage() {
  const { items, clearCart, increaseQuantity, decreaseQuantity } = useCart(); // ✅ Client-side cart only
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [distance, setDistance] = useState<number | null>(null);
  const [delivery, setDelivery] = useState<any>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [itemsState, setItems] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [checkingOrder, setCheckingOrder] = useState(true);
  const [isStudent, setIsStudent] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);

  // 👇 MUST be here (top-level of component)
  const itemsTotalPounds = items.reduce(
    (sum: number, i: { price: number; quantity: number }) =>
      sum + i.price * i.quantity,
    0
  );

  // delivery fee comes from getDeliveryBand() in PENCE
  const deliveryPence = delivery?.fee ?? 0;
  const deliveryPounds = deliveryPence / 100;

  // apply student discount ONLY to delivery fee (still in pence)
  const discountedDeliveryFeePence = isStudent
    ? Math.round(deliveryPence * 0.85)
    : deliveryPence;

  // final total shown to user in pounds
  const finalTotalPounds = itemsTotalPounds + discountedDeliveryFeePence / 100;

  const canCheckout = !!delivery && items.length > 0;

  const handleCheckout = async () => {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({
          name: item.name,
          price: item.price, // number, NOT string
          quantity: item.quantity,
        })),
        deliveryFeePence: deliveryFee * 100,
      }),
    });

    const data = await res.json();

    if (!data.url) {
      alert("Payment failed");
      return;
    }

    window.location.href = data.url;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!address || address.length < 8) {
      setDistance(null);
      setDelivery(null);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoadingQuote(true);
        const res = await fetch("/api/distance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });

        const data = await res.json();

        setDeliveryFee(data.fee); // ← THIS MUST HAPPEN

        console.log("DELIVERY SET:", data.fee);

        setDistance(data.distanceMiles);
        setDelivery(getDeliveryBand(data.distanceMiles));
      } catch {
        setDistance(null);
        setDelivery(null);
      } finally {
        setLoadingQuote(false);
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [address]);

  useEffect(() => {
    const run = async () => {
      const customerId = getOrCreateCustomerId();
      if (!customerId) return;

      const q = query(
        collection(db, "orders"),
        where("customerId", "==", customerId),
        where("orderStatus", "in", ["PAID", "PREPARING", "DISPATCHED"]),
        orderBy("createdAt", "desc"),
        limit(1)
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        setActiveOrder({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }

      setCheckingOrder(false);
    };

    run();
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const uid = getOrCreateCustomerId();
      if (!uid) return;

      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        setIsStudent(!!snap.data().isStudent);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (delivery?.requiresQuote) {
      setDeliveryMessage(
        "Delivery over 10 miles requires a custom quote. Please contact support."
      );
      setDeliveryFee(0);
    } else {
      setDeliveryMessage("");
      setDeliveryFee(delivery?.fee ?? 0);
    }
  }, [delivery]);

  // Use unique variable names for fallback values
  const mockCartItems = [
    { name: "Sample Item", price: 5.99, quantity: 1 },
  ];
  const mockDeliveryFee = 299; // Pence

  const fallbackCartItems = items.length > 0 ? items : mockCartItems;
  const fallbackDeliveryFee = delivery?.fee ?? mockDeliveryFee;

  // Ensure logs for debugging during build
  console.log("Cart Items:", fallbackCartItems);
  console.log("Delivery Fee:", fallbackDeliveryFee);

  console.log("CART ITEMS", items);
  console.log("CART DEBUG", items);
  console.log("DELIVERY:", delivery);
  console.log("SENDING TO STRIPE");

  if (!mounted) {
    return null; // ⬅️ SAME on server & client
  }

  if (checkingOrder) return <p>Checking your latest order…</p>;

  if (items.length === 0 && activeOrder) {
    return (
      <main className="page-container">
        <h1>Your order is in progress</h1>
        <p><strong>Status:</strong> {activeOrder.orderStatus}</p>
        <p><strong>Payment:</strong> {activeOrder.paymentStatus}</p>

        <h3 className="mt-4">Delivery</h3>
        <p>{activeOrder.deliveryAddress}</p>

        <h3 className="mt-4">Total</h3>
        <p>£{(activeOrder.totalAmount / 100).toFixed(2)}</p>

        {/* Tracking UI next */}
        <OrderTracking status={activeOrder.orderStatus} />
      </main>
    );
  }

  if (items.length === 0) {
    return <p>Your cart is empty.</p>;
  }

  const hasInvalidWeight = items.some(
    i => i.unitType === "kg" && i.quantity < 0.25
  );

  return (
    <main className="cart-page">
      <div className="cart-container">

        {/* LEFT */}
        <div className="cart-items">
          <button
            className="back-button"
            onClick={() => router.push("/catalogue")}
          >
            ← Back to shop
          </button>

          <h1>Your Cart</h1>

          {/* Address */}
          <label className="block mb-2 text-sm">
            Delivery address
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="address-input"
            placeholder="Full delivery address"
          />

          {loadingQuote && (
            <p className="text-sm text-gray-500 mt-2">
              Calculating delivery…
            </p>
          )}

          {delivery && (
            <div className="delivery-summary">
              <p>
                <strong>Delivery:</strong>{" "}
                {isStudent ? (
                  <>
                    <span style={{ textDecoration: "line-through", color: "#999" }}>
                      £{(deliveryPence / 100).toFixed(2)}
                    </span>{" "}
                    <strong style={{ color: "green" }}>
                      £{(discountedDeliveryFeePence / 100).toFixed(2)}
                    </strong>
                  </>
                ) : (
                  <strong>£{(deliveryPence / 100).toFixed(2)}</strong>
                )}
              </p>
            </div>
          )}

          {items.map((item) => {
            const isKg = item.unitType === "kg"; // Detect unit type

            return (
              <div key={item.id} className="cart-item">
                <div>
                  <h4>{item.name}</h4>

                  <div className="quantity-section">
                    {isKg ? (
                      <>
                        <button
                          className="edit-weight-btn"
                          onClick={() => router.push(`/product/${item.id}`)}
                        >
                          Edit quantity
                        </button>
                        <small style={{ color: "#777" }}>
                          Sold by weight — tap to edit
                        </small>
                      </>
                    ) : (
                      <div className="cart-qty">
                        <button
                          onClick={() =>
                            decreaseQuantity(item.id, (q) => Math.max(1, q - 1))
                          }
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() =>
                            increaseQuantity(item.id, (q) => q + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    )}

                    <p className="price">
                      £{(item.price * item.quantity).toFixed(2)}
                    </p>

                    <small>
                      £{item.price.toFixed(2)} per {isKg ? "kg" : "item"}
                    </small>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT */}
        <div className="cart-summary">
          <div className="summary-box">
            <h3>Order Summary</h3>

            {isStudent && (
              <div style={{
                background: "#e6f7ee",
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "12px",
                color: "#137333",
                fontSize: "14px"
              }}>
                🎓 Student discount applied (15% off delivery)
              </div>
            )}

            <div className="summary-row">
              <span>Items</span>
              <strong>£{itemsTotalPounds.toFixed(2)}</strong>
            </div>

            <div className="summary-row">
              <span>Delivery</span>
              <strong>
                {isStudent ? (
                  <>
                    <span style={{ textDecoration: "line-through", color: "#999" }}>
                      £{(deliveryPence / 100).toFixed(2)}
                    </span>{" "}
                    <strong style={{ color: "green" }}>
                      £{(discountedDeliveryFeePence / 100).toFixed(2)}
                    </strong>
                  </>
                ) : (
                  `£${(deliveryPence / 100).toFixed(2)}`
                )}
              </strong>
            </div>

            <div className="summary-row total">
              <span>Total</span>
              <strong>£{finalTotalPounds.toFixed(2)}</strong>
            </div>

            <button
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={!canCheckout || hasInvalidWeight}
            >
              Pay with Stripe
            </button>

            <button className="clear-btn" onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}

function OrderTracking({ status }: { status: string }) {
  const steps = ["PAID", "PREPARING", "DISPATCHED", "COMPLETED"];
  const current = steps.indexOf(status);

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Order progress</h3>
      <ul style={{ marginTop: 8 }}>
        {steps.map((s, i) => (
          <li key={s} style={{ opacity: i <= current ? 1 : 0.4 }}>
            {i <= current ? "✓ " : "• "} {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};
