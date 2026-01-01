"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/app/lib/firebaseClient";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/autoplay";

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

        console.log("Query Path:", q); // Debugging log

        const snap = await getDocs(q);

        const imageMapping = {
          "Just Cook": "just-cook.png",
          "Referral Discount": "referral.png",
          "Fresh Fruits & Vegetables": "fresh-fruits.png",
          "Fresh Frozen": "fresh-frozen.jpg",
          "Store Closing Early": "close.png",
          "Household Items": "household.png",
        };

        const data = snap.docs.map((doc) => {
          const docData = doc.data();
          console.log("Document Data:", docData); // Log each document's data
          return {
            id: doc.id,
            title: docData.title,
            subtitle: docData.subtitle,
            imageUrl: `/images/${imageMapping[docData.title] || "placeholder.png"}`, // Map to public/images folder
          };
        });

        console.log("Fetched Firestore Data:", data); // Debugging log

        setItems(data);
      } catch (error) {
        console.error("Error fetching Firestore data:", error);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const swiperElement = document.querySelector(".swiper") as HTMLElement & { swiper?: any };
      if (document.visibilityState === "visible" && swiperElement?.swiper?.autoplay) {
        console.log("Page visible, restarting autoplay");
        swiperElement.swiper.autoplay.start();
      } else if (document.visibilityState === "hidden" && swiperElement?.swiper?.autoplay) {
        console.log("Page hidden, stopping autoplay");
        swiperElement.swiper.autoplay.stop();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (!items.length) return null;

  console.log("Swiper modules loaded:", Autoplay); // Debugging log

  return (
    <section className={styles.wrapper}>
      <Swiper
        modules={[Autoplay]}
        slidesPerView="auto"
        spaceBetween={20}
        loop
        speed={8000}
        autoplay={{
          delay: 0,
          disableOnInteraction: false,
          pauseOnMouseEnter: false,
        }}
        allowTouchMove={true}
        onSwiper={(swiper) => swiper.autoplay.start()}
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
