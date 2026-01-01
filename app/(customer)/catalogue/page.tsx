"use client";

import { useCart } from "@/app/lib/cart";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/app/lib/firebaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import WhatsNew from "@/app/components/WhatsNew";
import styles from "./catalogue.module.css";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  imageUrl?: string[];
};

const categories = [
  "ALL",
  "Grains & Staples",
  "Oil, Spices & Seasoning",
  "Canned & Packaged Foods",
  "Fresh Produce",
  "Proteins (Fresh & Frozen)",
  "Snacks & Drinks",
  "Household",
  "Misc",
];

export default function CataloguePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const category = searchParams.get("category") || "ALL";
  const tag = searchParams.get("tag");

  useEffect(() => {
    const load = async () => {
      let q;

      if (tag) {
        q = query(collection(db, "products"), where("tags", "array-contains", tag));
      } else if (category !== "ALL") {
        q = query(collection(db, "products"), where("category", "==", category));
      } else {
        q = collection(db, "products");
      }

      const snap = await getDocs(q);
      setProducts(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Product),
        }))
      );

      setLoading(false);
    };

    load();
  }, [category, tag]);

  if (loading) return <p>Loading catalogue…</p>;

  return (
    <main className="catalogue-wrapper">
      <div className="catalogue-container">

        <h2 className="section-title">What’s New</h2>
        <WhatsNew />

        <h2 className="section-title">Categories</h2>
        <div className="category-scroll">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-pill ${category === cat ? "active" : ""}`}
              onClick={() =>
                router.push(
                  cat === "ALL"
                    ? "/catalogue"
                    : `/catalogue?category=${encodeURIComponent(cat)}`
                )
              }
            >
              {cat}
            </button>
          ))}
        </div>

        <h2 className="section-title">Products</h2>

        <div className={styles.catalogueGrid}>
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className={styles.catalogueLink}
            >
              <div className={styles.catalogueCard}>
                <img src={p.imageUrl?.[0]} alt={p.name} />
                <h4>{p.name}</h4>
                <p>£{p.unitPrice.toFixed(2)}</p>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addToCart({
                      id: p.id,
                      name: p.name,
                      price: p.unitPrice,
                      quantity: 1,
                    });
                  }}
                >
                  Add to cart
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
