"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/app/lib/firebaseClient";
import { useCart } from "@/app/lib/cart";

/* 👇 WHATSAPP CONSTANTS HERE */
const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

const message = encodeURIComponent(
  "Hi JustCook, I need help with an order or product."
);

const whatsappLink = whatsappNumber
  ? `https://wa.me/${whatsappNumber}?text=${message}`
  : "";

/* 👇 COMPONENT */
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

const ProductPage: React.FC = () => {
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

      {/* WhatsApp Button */}
      <div className="whatsapp-button-wrapper">
        {whatsappNumber && (
          <a
            className="whatsapp-button"
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#ffffff",
              border: "2px solid #25D366",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
              cursor: "pointer",
              zIndex: 1000,
              transition: "all 0.2s ease-in-out",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f0fdf4";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
            }}
            aria-label="WhatsApp Support"
          >
            {/* WhatsApp Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="#25D366"
            >
              <path d="M12 2a10 10 0 0 0-8.66 15l-1.3 4.75 4.88-1.28A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.13l-.3-.17-2.9.77.78-2.82-.2-.3A8 8 0 1 1 12 20Zm4.6-5.4c-.25-.12-1.47-.73-1.7-.82-.23-.08-.4-.12-.57.12-.17.25-.65.82-.8.98-.15.17-.3.18-.55.06-.25-.12-1.06-.39-2.02-1.24-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.38.1-.5.1-.1.25-.27.37-.4.12-.12.17-.2.25-.35.08-.15.04-.28-.02-.4-.06-.12-.57-1.38-.78-1.9-.2-.48-.4-.42-.57-.43h-.48c-.17 0-.4.06-.62.28-.22.22-.82.8-.82 1.95 0 1.15.85 2.26.97 2.42.12.17 1.67 2.55 4.05 3.58.57.25 1.02.4 1.37.5.58.18 1.1.15 1.52.1.46-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.15-1.18-.05-.1-.22-.15-.47-.28Z" />
            </svg>
          </a>
        )}
      </div>
    </main>
  );
};

export default ProductPage;
