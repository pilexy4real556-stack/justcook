"use client";

import { useEffect } from "react";

export default function ReferralCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");

    if (ref) {
      localStorage.setItem("pendingReferralCode", ref);
      console.log("Referral stored:", ref);
    }
  }, []);

  return null;
}
