"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebaseClient";
import { useRouter } from "next/navigation";

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "#f59e0b",
  CONFIRMED: "#3b82f6",
  IN_PREPARATION: "#8b5cf6",
  READY: "#22c55e",
  DISPATCHED: "#64748b",
};

type Order = {
  id: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount?: number;
  paymentStatus?: string;
  orderStatus?: string;
  deliveryBand?: string;
  deliveryFee?: number | null;
  createdAt?: Timestamp;
};

export default function PicOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("Snapshot size:", snapshot.size);
        const data: Order[] = snapshot.docs.map((doc) => {
          const raw = doc.data();
          console.log("Raw order data:", raw);

          return {
            id: doc.id,
            customerName: raw.customerName ?? "Unknown",
            customerPhone: raw.customerPhone ?? "", // 👈 HERE
            totalAmount: typeof raw.totalAmount === "number" ? raw.totalAmount : 0,
            paymentStatus: raw.paymentStatus ?? "UNKNOWN",
            orderStatus: raw.orderStatus ?? "UNKNOWN",
            deliveryBand: raw.deliveryBand ?? "-",
            deliveryFee:
              typeof raw.deliveryFee === "number" ? raw.deliveryFee : null,
            createdAt: raw.createdAt,
          };
        });

        console.log("Processed orders:", data);
        setOrders(data);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore read error:", err);
        setError("Unable to load orders");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <main style={{ padding: 40 }}>
      <h1>📦 PIC – Incoming Orders</h1>

      {loading && <p>Loading orders...</p>}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <p>No orders yet.</p>
      )}

      {!loading && !error && orders.length > 0 && (
        <table
          style={{
            marginTop: 20,
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th align="left">Customer</th>
              <th align="left">Phone</th>
              <th align="left">Total (£)</th>
              <th align="left">Payment</th>
              <th align="left">Status</th>
              <th align="left">Delivery</th>
              <th align="left">Created</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                onClick={() => router.push(`/pic/orders/${order.id}`)}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fafafa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <td>{order.customerName}</td>
                <td>
                  {order.customerPhone ? (
                    <a
                      href={`tel:${order.customerPhone}`}
                      style={{ color: "#2563eb" }}
                    >
                      {order.customerPhone}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{(order.totalAmount! / 100).toFixed(2)}</td>
                <td>{order.paymentStatus}</td>
                <td>{order.orderStatus}</td>
                <td>
                  Band {order.deliveryBand}{" "}
                  {order.deliveryFee !== null
                    ? `(£${(order.deliveryFee / 100).toFixed(2)})`
                    : "(Quote)"}
                </td>
                <td>
                  {order.createdAt
                    ? order.createdAt.toDate().toLocaleString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
