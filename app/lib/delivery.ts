"use client";

import { useEffect, useState } from "react";

export function getDeliveryBand(distanceMiles: number) {
  if (distanceMiles == null || Number.isNaN(distanceMiles)) return null;

  if (distanceMiles <= 3) return { label: "0–3 miles", fee: 299 };
  if (distanceMiles <= 6) return { label: "3–6 miles", fee: 499 };
  if (distanceMiles <= 10) return { label: "6–10 miles", fee: 799 };

  return { label: "10+ miles", fee: 0, requiresQuote: true };
}

export const useDeliveryLogic = () => {
  const [distance, setDistance] = useState<number | null>(null);
  const [delivery, setDelivery] = useState<any>(null);

  const handleDeliveryCheck = async (address: string) => {
    const miles = await calculateDistanceFromAddress(address);

    if (miles != null) {
      const result = getDeliveryBand(miles);
      setDelivery(result);
    }
  };

  return { distance, delivery, handleDeliveryCheck };
};

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function calculateDistanceFromAddress(address: string): Promise<number> {
  if (!BASE_URL) {
    console.error("[DISTANCE ERROR] NEXT_PUBLIC_BACKEND_URL missing");
    return 0;
  }

  const response = await fetch(`${BASE_URL}/api/distance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("[DISTANCE ERROR] API failed:", response.status, response.statusText, errText);
    return 0;
  }

  const data = await response.json();

  if (typeof data.distanceMiles !== "number" || data.distanceMiles <= 0) {
    console.error("[DISTANCE ERROR] Invalid payload:", data);
    return 0;
  }

  return data.distanceMiles;
}
