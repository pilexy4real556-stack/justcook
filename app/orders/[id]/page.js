"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebaseClient";

export default function OrderPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const loadOrder = async () => {
      const snap = await getDoc(doc(db, "orders", id));
      if (snap.exists()) setOrder(snap.data());
    };
    loadOrder();
  }, [id]);

  if (!order) return <p style={{ padding: 24 }}>Loading order...</p>;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Order Details</h1>

        <div style={styles.section}>
          <p><strong>Order ID</strong></p>
          <p className="muted">{id}</p>
        </div>

        <div style={styles.section}>
          <p><strong>Delivery Address</strong></p>
          <p>{order.deliveryAddress}</p>
        </div>

        <div style={styles.section}>
          <p><strong>Delivery Fee</strong></p>
          <p style={styles.price}>£{(order.deliveryFee / 100).toFixed(2)}</p>
        </div>

        <div style={styles.section}>
          <p><strong>Items</strong></p>
          <ul style={styles.list}>
            {order.items.map((item, i) => (
              <li key={i} style={styles.item}>
                <span>{item.name}</span>
                <span>× {item.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "32px",
    maxWidth: "700px",
    margin: "0 auto",
  },

  card: {
    background: "#fff",
    borderRadius: "14px",
    padding: "28px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },

  title: {
    marginBottom: "24px",
    fontSize: "26px",
    fontWeight: "700",
  },

  section: {
    marginBottom: "20px",
  },

  price: {
    fontSize: "18px",
    fontWeight: "700",
  },

  list: {
    listStyle: "none",
    padding: 0,
    marginTop: "10px",
  },

  item: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #eee",
    fontSize: "15px",
  },
};
