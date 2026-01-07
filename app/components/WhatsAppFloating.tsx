"use client";

import { useEffect, useState } from "react";

export default function WhatsAppFloating() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

  if (!whatsappNumber) {
    if (process.env.NODE_ENV === "production") {
      console.warn("WhatsApp number missing in production");
    }
    return null;
  }

  return (
    <a
      href={`https://wa.me/${whatsappNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "#ffffff",
        border: "2px solid #b7f000",
        borderRadius: "50%",
        width: "56px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 10px rgba(0,0,0,.15)",
        zIndex: 9999,
      }}
    >
      <svg width="28" height="28" viewBox="0 0 32 32" fill="#25D366">
        <path d="M16 2C8.28 2 2 8.05 2 15.5c0 3.04 1.1 5.83 2.93 8.02L3 30l6.74-1.76A14.6 14.6 0 0 0 16 29c7.72 0 14-6.05 14-13.5S23.72 2 16 2z" />
      </svg>
    </a>
  );
}
