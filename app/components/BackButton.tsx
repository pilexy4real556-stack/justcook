"use client";

import { usePathname, useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Hide on Home / Catalogue / Cart
  if (pathname === "/" || pathname === "/catalogue" || pathname === "/cart")
    return null;

  return (
    <button
      onClick={() => router.back()}
      style={{
        marginBottom: "20px",
        backgroundColor: "#d9f99d",
        border: "none",
        color: "#000",
        padding: "8px 14px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "14px",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      ← Back
    </button>
  );
}
