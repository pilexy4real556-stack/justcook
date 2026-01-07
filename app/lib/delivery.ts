"use client";

import { useEffect, useState } from "react";

export function getDeliveryBand(distanceMiles: number) {
  if (distanceMiles == null || isNaN(distanceMiles)) {
    return null;
  }

  if (distanceMiles < 3) {
    return { band: "0–3 miles", fee: 299 };
  }

  if (distanceMiles < 6) {
    return { band: "3–6 miles", fee: 499 };
  }

  if (distanceMiles < 10) {
    return { band: "6–10 miles", fee: 699 };
  }

  return {
    band: "10+ miles",
    fee: 0, // IMPORTANT: never null
    requiresQuote: true,
  };
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

if (!BASE_URL) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
}

export async function calculateDistanceFromAddress(address: string): Promise<number | null> {
  if (!address || address.trim().length < 5) {
    return null; // DO NOT log error
  }

  try {
    const response = await fetch(`${BASE_URL}/api/distance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      // Only log real failures
      console.warn("Distance API returned non-OK", response.status);
      return null;
    }

    const data = await response.json();
    return data.distanceMiles;
  } catch (err) {
    console.warn("Distance fetch failed", err);
    return null;
  }
}
