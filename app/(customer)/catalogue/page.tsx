"use client";

import { useCart } from "@/app/lib/cart";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/app/lib/firebaseClient";
import WhatsNew from "@/app/components/WhatsNew";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./catalogue.module.css";

type Product = {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  imageUrl?: string[];
  unitType?: "kg" | "item";
};

export default function CataloguePage() {
  const searchParams = useSearchParams();
  const categoryFromQuery = searchParams.get("category");
  const tag = searchParams.get("tag");

  const router = useRouter();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(categoryFromQuery || "ALL");

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      let q;

      if (tag) {
        q = query(
          collection(db, "products"),
          where("tags", "array-contains", tag)
        );
      } else if (category && category !== "ALL") {
        q = query(
          collection(db, "products"),
          where("category", "==", category)
        );
      } else {
        q = collection(db, "products");
      }

      const snap = await getDocs(q);

      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Product),
      }));

      setProducts(data);
      setLoading(false);
    };

    load();
  }, [category, tag]);

  useEffect(() => {
    if (categoryFromQuery) {
      setCategory(categoryFromQuery);
    }
  }, [categoryFromQuery]);

  if (loading) return <p>Loading catalogue…</p>;

  return (
    <main style={{ paddingTop: "120px" }} className="page-container">
      {/* HERO / CAROUSEL */}
      <h2 className="section-title">What’s New</h2>
      <WhatsNew />

      {/* CATEGORY FILTER */}
      <h2 className="section-title">Categories</h2>
      <div className="category-scroll">
        {["ALL", "Grains & Staples", "Oil, Spices & Seasoning", "Canned & Packaged Foods", "Fresh Produce", "Proteins (Fresh & Frozen)", "Snacks & Drinks", "Household", "Misc"].map((cat) => (
          <button
            key={cat}
            className={`category-pill ${category === cat ? "active" : ""}`}
            onClick={() => router.push(`/catalogue?category=${encodeURIComponent(cat)}`)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* PRODUCT GRID */}
      <h2 className="section-title">Products</h2>
      <div className={styles.catalogueGrid}>
        {products.map((p) => (
          <div
            className={styles.catalogueCard}
            key={p.id}
            onClick={() => router.push(`/product/${p.id}`)} // Redirect to product description page
          >
            <div className={styles.imageWrap}>
              <img src={p.imageUrl?.[0]} alt={p.name} />
            </div>

            <div className={styles.cardBody}>
              <h4>{p.name}</h4>
              <p className={styles.price}>£{p.unitPrice.toFixed(2)}</p>

              <button
                className={styles.addToCartBtn}
                onClick={(e) => {
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
          </div>
        ))}
      </div>
    </main>
  );
}
