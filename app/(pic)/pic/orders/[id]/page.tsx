"use client";

import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebaseClient";
import { useParams, useRouter } from "next/navigation";

type Order = {
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  totalAmount?: number;
  paymentStatus?: string;
  orderStatus?: string;
  deliveryFee?: number;
  deliveryBand?: string;
};

const PicOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadOrder = async () => {
      const ref = doc(db, "orders", id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setOrder(snap.data() as Order);
      }

      setLoading(false);
    };

    loadOrder();
  }, [id]);

  if (loading) {
    return <p style={{ padding: 40 }}>Loading order…</p>;
  }

  if (!order) {
    return <p style={{ padding: 40 }}>Order not found.</p>;
  }

  return (
    <main style={{ padding: 40, fontFamily: 'Arial, sans-serif', lineHeight: 1.6 }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Order details</h1>

      <p><strong>Customer:</strong> {order.customerName ?? "Unknown"}</p>

      <p>
        <strong>Phone:</strong>{" "}
        {order.customerPhone ? (
          <a href={`tel:${order.customerPhone}`} style={{ color: '#007BFF', textDecoration: 'none' }}>
            {order.customerPhone}
          </a>
        ) : (
          "—"
        )}
      </p>

      <p><strong>Address:</strong> {order.deliveryAddress}</p>
      <p><strong>Status:</strong> {order.orderStatus}</p>
      <p><strong>Payment:</strong> {order.paymentStatus}</p>

      <p>
        <strong>Total:</strong>{" "}
        £{((order.totalAmount ?? 0) / 100).toFixed(2)}
      </p>

      <p>
        <strong>Delivery:</strong>{" "}
        Band {order.deliveryBand} (£{((order.deliveryFee ?? 0) / 100).toFixed(2)})
      </p>
    </main>
  );
};

export default PicOrderDetailsPage;
