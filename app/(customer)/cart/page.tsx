"use client";

import { useCart } from "@/app/lib/cart";
import { db } from "@/app/lib/firebaseClient";
import { getOrCreateCustomerId } from "../../lib/customerId";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { calculateDistanceFromAddress, getDeliveryBand } from "../../lib/delivery";

type DeliveryState =
  | null
  | {
      band: string;
      fee: number; // pence
      requiresQuote?: boolean;
    };

export default function CartPage() {
  const { items, clearCart, increaseQuantity, decreaseQuantity } = useCart(); // ✅ keep your cart hook
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const [distance, setDistance] = useState<number | null>(null);
  const [delivery, setDelivery] = useState<DeliveryState>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [checkingOrder, setCheckingOrder] = useState(true);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);

  const [isStudent, setIsStudent] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");

  // Referral state (validated BEFORE checkout)
  const [referralCode, setReferralCode] = useState("");
  const [referralValid, setReferralValid] = useState(false);
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [referralError, setReferralError] = useState("");
  const [referralApplied, setReferralApplied] = useState(false);
  const [validatingReferral, setValidatingReferral] = useState(false);

  // Derived values
  const normalizedPhone = useMemo(() => phone.replace(/\D/g, ""), [phone]);

  const itemsTotalPounds = useMemo(() => {
    return items.reduce(
      (sum: number, i: { price: number; quantity: number }) =>
        sum + Number(i.price) * Number(i.quantity),
      0
    );
  }, [items]);

  // delivery fee is in pence
  const deliveryPence = delivery?.fee ?? 0;

  // Student discount applies ONLY to delivery fee
  const discountedDeliveryFeePence = useMemo(() => {
    return isStudent ? Math.round(deliveryPence * 0.85) : deliveryPence;
  }, [isStudent, deliveryPence]);

  const finalTotalPounds = useMemo(() => {
    return itemsTotalPounds + discountedDeliveryFeePence / 100;
  }, [itemsTotalPounds, discountedDeliveryFeePence]);

  const canCheckout =
    !loadingQuote &&
    delivery !== null &&
    typeof delivery.fee === "number" &&
    items.length > 0 &&
    normalizedPhone.length >= 8 &&
    (!referralCode || referralValid); // ✅

  // -------------------------------
  // Mount guard
  // -------------------------------
  useEffect(() => {
    setMounted(true);
  }, []);

  // -------------------------------
  // Delivery calculation from address
  // -------------------------------
  useEffect(() => {
    if (!address || address.trim().length < 6) {
      setDelivery(null);
      setDistance(null);
      setLoadingQuote(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoadingQuote(true);

      try {
        const miles = await calculateDistanceFromAddress(address);
        if (cancelled) return;

        if (!miles || Number.isNaN(miles) || miles <= 0) {
          console.error("[DELIVERY ERROR] Invalid miles:", miles);
          console.error("[DELIVERY DEBUG] Address:", address);
          setDelivery(null);
          setDistance(null);
          return;
        }

        const band = getDeliveryBand(miles);
        console.log("[DELIVERY OK]", { miles, band });

        if (!band) {
          setDelivery(null);
          setDistance(null);
          return;
        }

        setDistance(miles);
        setDelivery({
          band: band.label,
          fee: band.fee,
          requiresQuote: !!(band as any).requiresQuote,
        });
      } catch (err) {
        console.error("[DELIVERY EXCEPTION]", err);
        setDelivery(null);
        setDistance(null);
      } finally {
        if (!cancelled) setLoadingQuote(false);
      }
    };

    const timeout = setTimeout(run, 500);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [address]);

  // -------------------------------
  // Delivery message
  // -------------------------------
  useEffect(() => {
    if (delivery?.requiresQuote) {
      setDeliveryMessage(
        "Delivery over 10 miles requires a custom quote. Please contact support."
      );
    } else {
      setDeliveryMessage("");
    }
  }, [delivery]);

  // -------------------------------
  // Active order check
  // -------------------------------
  useEffect(() => {
    const run = async () => {
      const customerId = await getOrCreateCustomerId();
      if (!customerId) {
        setCheckingOrder(false);
        return;
      }

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

  // -------------------------------
  // Student flag
  // -------------------------------
  useEffect(() => {
    const loadUser = async () => {
      const uid = await getOrCreateCustomerId();
      if (!uid) return;

      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        setIsStudent(!!snap.data().isStudent);
      }
    };

    loadUser();
  }, []);

  // -------------------------------
  // Load pending referral code from URL
  // -------------------------------
  useEffect(() => {
    // Load pending referral code from localStorage (set by ReferralCapture component)
    const pendingCode = localStorage.getItem("pendingReferralCode");
    if (pendingCode && !referralCode) {
      setReferralCode(pendingCode);
      localStorage.removeItem("pendingReferralCode");
      // Auto-validate
      validateReferral(pendingCode).catch((err) => {
        console.error("Failed to validate pending referral code:", err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------
  // Referral validation (call backend)
  // IMPORTANT: validate returns { valid: true, referrerId }
  // -------------------------------
  async function validateReferral(code: string): Promise<boolean> {
    const customerId = await getOrCreateCustomerId();
    if (!customerId) {
      setReferralError("Unable to identify customer");
      return false;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/referral/validate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, customerId }),
      }
    );

    const data = await res.json();

    if (!res.ok || !data.valid) {
      setReferralValid(false);
      setReferrerId(null);
      setReferralError("Invalid referral code");
      return false;
    }

    setReferralValid(true);
    setReferrerId(data.referrerId);
    setReferralError("");
    return true;
  }

  // Validate on blur (stable + avoids extra deps)
  const handleReferralBlur = async () => {
    if (referralApplied) return;
    await validateReferral(referralCode);
  };

  // -------------------------------
  // Checkout
  // -------------------------------
  const handleCheckout = async () => {
    if (!canCheckout) {
      // Make it obvious why checkout is blocked
      console.log("[CHECKOUT BLOCKED]", {
        loadingQuote,
        delivery,
        itemsLen: items.length,
        phoneLen: normalizedPhone.length,
        referralCode,
        referralValid,
        referrerId,
        referralError,
      });
      alert("Please complete delivery details before checkout.");
      return;
    }

    const customerId = await getOrCreateCustomerId();
    if (!customerId) {
      alert("Unable to identify customer");
      return;
    }

    // If they entered a referral code but it hasn't been validated yet, validate now
    if (referralCode && !referralValid) {
      const ok = await validateReferral(referralCode);
      if (!ok) return; // referralError already set
    }

    setReferralApplied(true);

    const totalAmountPence =
      Math.round(itemsTotalPounds * 100) + discountedDeliveryFeePence;

    const body: any = {
      items: items.map((i) => ({
        name: i.name,
        price: Number(i.price),
        quantity: Number(i.quantity),
      })),
      customerId,
      phone: normalizedPhone,
      deliveryFeePence: delivery?.fee ?? 0,
      deliveryAddress: address,
      totalAmount: totalAmountPence, // 🔥 REQUIRED
    };

    // IMPORTANT: referrerId must be the OWNER of the code (from validate),
    // not the current customerId.
    if (referralCode && referralValid) {
      body.referral = {
        code: referralCode,
        referrerId,
      };
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/checkout`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // These should match your backend error codes/messages
      const code = data?.error;

      if (code === "INVALID_CODE") {
        setReferralError("Invalid referral code");
        setReferralValid(false);
        setReferrerId(null);
        setReferralApplied(false);
        return;
      }
      if (code === "SELF_REFERRAL") {
        setReferralError("You cannot use your own code");
        setReferralValid(false);
        setReferrerId(null);
        setReferralApplied(false);
        return;
      }
      if (code === "ALREADY_USED") {
        setReferralError("Referral already used");
        setReferralValid(false);
        setReferrerId(null);
        setReferralApplied(false);
        return;
      }

      console.error("[CHECKOUT ERROR]", data);
      alert("Checkout failed");
      return;
    }

    if (!data?.url) {
      alert("Payment failed");
      return;
    }

    window.location.href = data.url;
  };

  // -------------------------------
  // Render guards
  // -------------------------------
  if (!mounted) return null;
  if (checkingOrder) return <p>Checking your latest order…</p>;

  if (items.length === 0 && activeOrder) {
    return (
      <main className="page-container">
        <h1>Your order is in progress</h1>
        <p>
          <strong>Status:</strong> {activeOrder.orderStatus}
        </p>
        <p>
          <strong>Payment:</strong> {activeOrder.paymentStatus}
        </p>

        <h3 className="mt-4">Delivery</h3>
        <p>{activeOrder.deliveryAddress}</p>

        <h3 className="mt-4">Total</h3>
        <p>£{(activeOrder.totalAmount / 100).toFixed(2)}</p>

        <OrderTracking status={activeOrder.orderStatus} />
      </main>
    );
  }

  if (items.length === 0) {
    return <p>Your cart is empty.</p>;
  }

  return (
    <main className="cart-page">
      <div className="cart-container">
        {/* LEFT */}
        <div className="cart-items">
          <button className="back-button" onClick={() => router.push("/catalogue")}>
            ← Back to shop
          </button>

          <h1>Your Cart</h1>

          {/* Address */}
          <label className="block mb-2 text-sm">Delivery address</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="address-input"
            placeholder="Full delivery address"
          />

          {/* Phone */}
          <label className="block mb-2 text-sm">
            Phone number <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="address-input"
            placeholder="+44 7123 456789"
          />
          <small style={{ color: "#666" }}>
            Used only to contact you during delivery
          </small>

          {loadingQuote && (
            <p className="text-sm text-gray-500 mt-2">Calculating delivery…</p>
          )}

          {deliveryMessage && (
            <p className="text-sm mt-2" style={{ color: "#b00020" }}>
              {deliveryMessage}
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

          {/* Items */}
          {items.map((item) => (
            <div key={item.id} className="cart-item">
              <span className="item-name">{item.name}</span>
              <span className="item-price">£{Number(item.price).toFixed(2)}</span>

              <div className="quantity-controls">
                <button className="quantity-btn" onClick={() => decreaseQuantity(item.id)}>
                  −
                </button>
                <span className="quantity">{item.quantity}</span>
                <button className="quantity-btn" onClick={() => increaseQuantity(item.id)}>
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT */}
        <div className="cart-summary">
          <div className="summary-box">
            <h3>Order Summary</h3>

            {isStudent && (
              <div
                style={{
                  background: "#e6f7ee",
                  padding: "10px",
                  borderRadius: "6px",
                  marginBottom: "12px",
                  color: "#137333",
                  fontSize: "14px",
                }}
              >
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
                {delivery ? (
                  isStudent ? (
                    <>
                      <span style={{ textDecoration: "line-through", color: "#999" }}>
                        £{(deliveryPence / 100).toFixed(2)}
                      </span>{" "}
                      <span style={{ color: "green", fontWeight: 700 }}>
                        £{(discountedDeliveryFeePence / 100).toFixed(2)}
                      </span>
                    </>
                  ) : (
                    `£${(deliveryPence / 100).toFixed(2)}`
                  )
                ) : (
                  "£0.00"
                )}
              </strong>
            </div>

            <div className="summary-row total">
              <span>Total</span>
              <strong>£{finalTotalPounds.toFixed(2)}</strong>
            </div>

            {/* Referral */}
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 14, fontWeight: 600 }}>
                Referral code (optional)
              </label>

              <input
                value={referralCode}
                onChange={(e) => {
                  setReferralCode(e.target.value.toUpperCase());
                  setReferralError("");
                  setReferralValid(false);
                }}
                onBlur={() => validateReferral(referralCode)} // ✅ key line
                placeholder="JC-XXXXX"
                disabled={referralApplied}
              />

              {validatingReferral && referralCode && (
                <p style={{ color: "#666", fontSize: 13, marginTop: 6 }}>
                  Validating referral…
                </p>
              )}

              {referralError && (
                <p style={{ color: "red", fontSize: 13, marginTop: 6 }}>
                  {referralError}
                </p>
              )}

              {!referralError && referralCode && referralValid && (
                <p style={{ color: "#2e7d32", fontSize: 13, marginTop: 6 }}>
                  Referral valid ✓
                </p>
              )}

              {referralValid && (
                <p style={{ color: "#2e7d32", fontSize: 13, marginTop: 6 }}>
                  Referral code applied ✓
                </p>
              )}

              {referralApplied && (
                <p style={{ color: "#2e7d32", fontSize: 13, marginTop: 6 }}>
                  Referral will be applied at checkout ✓
                </p>
              )}
            </div>

            {/* Debug */}
            <div style={{ fontSize: 12, background: "#f8f8f8", padding: 10, marginTop: 10 }}>
              <pre>
{JSON.stringify(
  {
    address,
    loadingQuote,
    distance,
    delivery,
    canCheckout,
    referral: {
      referralCode,
      referralValid,
      referrerId,
      referralApplied,
      referralError,
    },
  },
  null,
  2
)}
              </pre>
            </div>

            <button
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={!canCheckout || validatingReferral}
              style={{ opacity: canCheckout && !validatingReferral ? 1 : 0.6 }}
            >
              {!delivery
                ? "Enter valid address"
                : loadingQuote
                ? "Calculating delivery…"
                : delivery?.requiresQuote
                ? "Custom quote required"
                : !normalizedPhone || normalizedPhone.length < 8
                ? "Enter phone number"
                : referralCode && !referralValid
                ? "Invalid referral code"
                : validatingReferral
                ? "Validating referral…"
                : "Pay with Stripe"}
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
