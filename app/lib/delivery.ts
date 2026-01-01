export function getDeliveryBand(distanceMiles: number) {
  console.log("DELIVERY FUNCTION CALLED", distanceMiles);

  if (distanceMiles <= 2) {
    return { band: "A", fee: 199 };
  }

  if (distanceMiles <= 5) {
    return { band: "B", fee: 299 };
  }

  if (distanceMiles <= 10) {
    return { band: "C", fee: 399 };
  }

  return { band: "D", fee: 499 };
}
