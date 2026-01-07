"use client";

export default function WhatsAppFloating() {
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
      className="whatsapp-float"
    >
      {/* icon */}
    </a>
  );
}
