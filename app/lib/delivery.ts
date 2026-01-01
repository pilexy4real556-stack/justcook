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
