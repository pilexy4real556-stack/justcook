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
          return {
            id: doc.id,
            title: docData.title,
            subtitle: docData.subtitle,
            imageUrl: `/images/${imageMapping[docData.title] || "placeholder.png"}`,
          };
        });

        setItems(data);
      } catch (error) {
        console.error("Error fetching Firestore data:", error);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const swiperElement = document.querySelector(".swiper") as HTMLElement & { swiper?: any };
    swiperElement?.swiper?.autoplay?.start();
  }, [items]);

  if (!items.length) return null;

  return (
    <section className={styles.wrapper}>
      <div className="carousel" key="whats-new-carousel">
        <Swiper
          modules={[Autoplay]}
          slidesPerView="auto"
          spaceBetween={20}
          loop={true} // Ensure looping is enabled
          speed={5000}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false, // Prevent stopping on user interaction
            pauseOnMouseEnter: false, // Ensure autoplay continues even on hover
          }}
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
      </div>
    </section>
  );
}
