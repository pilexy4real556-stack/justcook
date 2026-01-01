"use client";

import "./globals.css";
import { App } from "@capacitor/app";
import { ReactNode, useEffect } from "react";
import { CartProvider } from "@/app/lib/cart";
import BackButton from "./components/BackButton";
import { useRouter } from "next/navigation";
import ReferralCapture from "./components/ReferralCapture";

export default function RootLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    App.addListener("backButton", () => {
      router.back();
    });
  }, []);

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#c8f000" />
      </head>
      <body>
        <header style={{ padding: "12px" }}>
          <BackButton />
        </header>
        <ReferralCapture />
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
