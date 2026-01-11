"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/app/lib/firebaseClient";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

import styles from "./WhatsNew.module.css";

type Item = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
};

export default function WhatsNew() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(
            db,
            "storeMessages",
            "announcements",
            "announcements"
          ),
          where("active", "==", true)
        );

        const snap = await getDocs(q);

        const imageMapping: Record<string, string> = {
          "Just Cook": "just-cook.png",
          "Referral Discount": "referral.png",
          "Fresh Fruits & Vegetables": "fresh-fruits.png",
          "Fresh Frozen": "fresh-frozen.jpg",
          "Store Closing Early": "close.png",
          "Household Items": "household.png",
        };

        setItems(
          snap.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              title: d.title,
              subtitle: d.subtitle,
              imageUrl: `/images/${imageMapping[d.title] ?? "placeholder.png"}`,
            };
          })
        );
      } catch (err) {
        console.error("WhatsNew Firestore error:", err);
      }
    };

    load();
  }, []);

  if (!items.length) return null;

  return (
    <section className={styles.wrapper}>
      <Swiper
        modules={[Autoplay]}
        slidesPerView="auto"
        spaceBetween={20}
        loop
        autoplay={{ delay: 2500, disableOnInteraction: false }}
      >
        {items.map((item) => (
          <SwiperSlide key={item.id} style={{ width: 320 }}>
            <div className={styles.card}>
              <img src={item.imageUrl} alt={item.title} />
              <div className={styles.text}>
                <h3>{item.title}</h3>
                {item.subtitle && <p>{item.subtitle}</p>}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
