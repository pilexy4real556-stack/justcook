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

export async function calculateDistanceFromAddress(address: string): Promise<number | null> {
  try {
    const response = await fetch("/api/distance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      console.error("Failed to calculate distance", response.statusText);
      return null;
    }

    const data = await response.json();
    return data.distanceMiles || null;
  } catch (error) {
    console.error("Error calculating distance", error);
    return null;
  }
}
