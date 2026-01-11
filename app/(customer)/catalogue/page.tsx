"use client";

import { useCart } from "../../lib/cart";
import { Suspense, useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import WhatsNew from "../../components/WhatsNew";
import styles from "./catalogue.module.css";
import Link from "next/link";

export const dynamic = "force-dynamic";

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
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <CatalogueContent />
    </Suspense>
  );
}

function CatalogueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const category = searchParams.get("category") || "ALL";
  const tag = searchParams.get("tag");

  const loadProducts = async () => {
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

  useEffect(() => {
    loadProducts();
  }, [category, tag]);

  const handleSearch = (query: string) => {
    if (query.trim() === "") {
      loadProducts();
    } else {
      const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );
      setProducts(filteredProducts);
    }
  };

  if (loading) return <p>Loading catalogue…</p>;

  return (
    <main className="catalogue-wrapper">
      <div className="catalogue-container">
        {/* FILTER BAR */}
        <div className="catalogue-filters">
          <div className={styles.categoryRow}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={styles.categoryButton}
                onClick={() => {
                  router.push(
                    cat === "ALL"
                      ? "/catalogue"
                      : `/catalogue?category=${encodeURIComponent(cat)}`
                  );
                  loadProducts();
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              onClick={() => handleSearch(search)}
              style={{
                padding: "10px 16px",
                marginLeft: "8px",
                backgroundColor: "#84cc16",
                color: "white",
                border: "none",
                borderRadius: "999px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "background-color 0.3s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#6aa312")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#84cc16")}
            >
              Search
            </button>
          </div>
        </div>

        <h2 className="section-title">What’s New</h2>
        <WhatsNew />

        <h2 className="section-title">Products</h2>

        <div className={styles.catalogueGrid}>
          {products.map((p) => (
            <div
              key={p.id}
              className={styles.catalogueCard}
              onClick={() => router.push(`/product/${p.id}`)}
              role="button"
            >
              <div className={styles.imageWrap}>
                <img src={p.imageUrl?.[0]} alt={p.name} />
              </div>

              <div className={styles.cardBody}>
                <h4>{p.name}</h4>
                <p className={styles.price}>£{p.unitPrice}</p>

                {/* STOP CLICK FROM BUBBLING */}
                <button
                  className={styles.addToCartBtn}
                  onClick={(e) => {
                    e.stopPropagation(); // 👈 THIS IS THE FIX
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
      </div>
    </main>
  );
}
