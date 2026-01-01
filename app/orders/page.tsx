"use client";

import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/app/lib/firebaseClient";
import { getOrCreateCustomerId } from "@/app/lib/customerId";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const customerId = getOrCreateCustomerId();

      const q = query(
        collection(db, "orders"),
        where("customerId", "==", customerId)
      );

      const snap = await getDocs(q);
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };

    fetchOrders();
  }, []);

  if (loading) return <p>Loading orders...</p>;

  if (!orders.length)
    return <p style={{ textAlign: "center" }}>You have no orders yet.</p>;

  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <h1>Your Orders</h1>

      {orders.map(order => (
        <div
          key={order.id}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <p style={{ margin: 0 }}>
              <strong>Status:</strong> {order.orderStatus}
            </p>
            <p style={{ margin: "6px 0 0" }}>
              <strong>Total:</strong> £{(order.totalAmount / 100).toFixed(2)}
            </p>
          </div>

          <a
            href={`/orders/${order.id}`}
            style={{
              padding: "8px 16px",
              backgroundColor: "#A3E635", // 🍋 lemon green
              color: "#1f2937",
              borderRadius: 6,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#84cc16")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#A3E635")
            }
          >
            View →
          </a>
        </div>
      ))}
    </div>
  );
}
