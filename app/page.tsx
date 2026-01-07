'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

const message = encodeURIComponent(
  "Hi JustCook, I need help with an order / product."
);

const whatsappLink = whatsappNumber
  ? `https://wa.me/${whatsappNumber}?text=${message}`
  : "#";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/catalogue');
  }, [router]);

  return (
    <div style={{ padding: "20px" }}>
      {whatsappNumber && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            background: "#25D366",
            color: "#fff",
            borderRadius: "10px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          WhatsApp Support
        </a>
      )}
    </div>
  );
}
