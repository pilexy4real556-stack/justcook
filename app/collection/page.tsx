"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/app/lib/firebaseClient";

type Product = {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  imageUrl?: string[];
};

export default function CollectionPage({ params }: { params: { target: string } }) {
  const router = useRouter();
  const { target } = params;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      const q = query(collection(db, "products"), where("tags", "array-contains", target));
      const snap = await getDocs(q);

      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Product, "id">),
      }));

      setProducts(data);
      setLoading(false);
    };

    loadProducts();
  }, [target]);

  if (loading) return <p>Loading products...</p>;

  return (
    <main className="page-container">
      <h1>Collection: {target}</h1>

      <div className="product-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            {product.imageUrl && product.imageUrl.length > 0 && (
              <img src={product.imageUrl[0]} alt={product.name} className="product-image" />
            )}
            <h4>{product.name}</h4>
            <p>£{product.unitPrice.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </main>
  );
}