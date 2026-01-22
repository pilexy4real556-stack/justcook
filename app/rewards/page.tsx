"use client";

import { useEffect, useState } from "react";
import { getOrCreateCustomerId } from "@/app/lib/customerId";
import { getOrCreateReferralCode } from "@/app/lib/referralClient";

export default function RewardsPage() {
  const [code, setCode] = useState("");

  useEffect(() => {
    const load = async () => {
      const id = await getOrCreateCustomerId();
      const ref = await getOrCreateReferralCode(id);
      setCode(ref);
    };
    load();
  }, []);

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${code}`
      : "";

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    alert("Referral link copied!");
  };

  const whatsapp = () => {
    const msg = `Get free delivery on JustCook! Use my link: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  return (
    <main style={{ padding: 20 }}>
      <h2>Your Referral Code</h2>

      <div style={{ marginTop: 12 }}>
        <code>{code}</code>
      </div>

      <button onClick={copy}>Copy Link</button>
      <button onClick={whatsapp}>Share on WhatsApp</button>
    </main>
  );
}
