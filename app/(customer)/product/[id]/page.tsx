"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/app/lib/firebaseClient";
import { useCart } from "@/app/lib/cart";

type Product = {
  id: string;
  name: string;
  unitPrice: number;
  description?: string;
  imageUrl?: string[];
  storeName?: string;
  category?: string;
  unitType?: "kg" | "item"; // Added unitType property
};

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const loadProduct = async () => {
      const ref = doc(db, "products", id as string);
      const snap = await getDoc(ref);

      if (!snap.exists()) return;

      const productData = {
        id: snap.id,
        ...(snap.data() as Omit<Product, "id">),
        category: snap.data()?.category || "Uncategorized", // Ensure category is set
      };

      setProduct(productData);

      // Fetch related products
      const q = query(
        collection(db, "products"),
        where("category", "==", productData.category)
      );

      const relatedSnap = await getDocs(q);

      const related = relatedSnap.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Product, "id">),
        }))
        .filter((p) => p.id !== productData.id)
        .slice(0, 4); // limit to 4

      setRelatedProducts(related);
      setLoading(false);
    };

    loadProduct();
  }, [id]);

  if (loading) return <p style={{ padding: 40 }}>Loading product…</p>;
  if (!product) return <p style={{ padding: 40 }}>Product not found.</p>;

  const isKg = product.unitType === "kg";

  const step = isKg ? 0.25 : 1;
  const min = step;

  return (
    <main className="product-page">
      <div className="product-wrapper">
        {/* LEFT: IMAGES */}
        <div className="product-gallery">
          <div className="slider-container">
            <img
              src={product.imageUrl?.[activeImage]}
              alt={product.name}
              className="slider-image"
              loading="lazy"
              decoding="async"
            />

            {/* Navigation */}
            {product.imageUrl && product.imageUrl.length > 1 && (
              <>
                <button
                  className="slider-btn left"
                  onClick={() =>
                    setActiveImage((prev) =>
                      prev === 0 ? product.imageUrl!.length - 1 : prev - 1
                    )
                  }
                >
                  ‹
                </button>

                <button
                  className="slider-btn right"
                  onClick={() =>
                    setActiveImage((prev) =>
                      prev === product.imageUrl!.length - 1 ? 0 : prev + 1
                    )
                  }
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Dots */}
          <div className="slider-dots">
            {product.imageUrl?.map((_, i) => (
              <span
                key={i}
                className={i === activeImage ? "dot active" : "dot"}
                onClick={() => setActiveImage(i)}
              />
            ))}
          </div>
        </div>

        {/* RIGHT: INFO */}
        <div className="product-details">
          <h1 className="product-title">{product.name}</h1>

          {/* Store Info */}
          {product.storeName && (
            <div className="store-box">
              <span className="store-label">Store</span>
              <span className="store-name">{product.storeName}</span>
            </div>
          )}

          {/* Price */}
          <p className="product-price">£{product.unitPrice.toFixed(2)}</p>

          {/* Description */}
          {product.description && (
            <div className="description-box">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>
          )}

          {/* Quantity Selector & Action */}
          <div className="quantity-section">
            {isKg ? (
              <>
                <label>Quantity (kg)</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(parseFloat(e.target.value) || 0.25)
                  }
                  className="kg-input"
                />
              </>
            ) : (
              <div className="quantity-controls">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                  −
                </button>

                <span>{quantity}</span>

                <button onClick={() => setQuantity((q) => q + 1)}>+</button>
              </div>
            )}

            <p className="price">£{(product.unitPrice * quantity).toFixed(2)}</p>

            <small>
              £{product.unitPrice} per {isKg ? "kg" : "item"}
            </small>

            {/* ✅ ADD TO CART BUTTON — THIS WAS MISSING */}
            <button
              className="add-to-cart-btn"
              onClick={() =>
                addToCart({
                  id: product.id,
                  name: product.name,
                  price: product.unitPrice,
                  quantity,
                })
              }
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <div className="related-section">
          <h3>You may also like</h3>

          <div className="related-grid">
            {relatedProducts.map((item) => (
              <div
                key={item.id}
                className="related-card"
                onClick={() => router.push(`/product/${item.id}`)}
              >
                <img src={item.imageUrl?.[0]} alt={item.name} />
                <p className="related-name">{item.name}</p>
                <p className="related-price">
                  £{item.unitPrice.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
