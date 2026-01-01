import { doc, getDoc } from "firebase/firestore";
import {
  collection,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db } from "../../src/lib/firebase";

export async function getProduct(productId: string) {
  const snap = await getDoc(doc(db, "products", productId));
  if (!snap.exists()) {
    throw new Error("Product not found");
  }
  return snap.data();
}

export async function getActiveProduct(productId: string) {
  const snap = await getDoc(doc(db, "products", productId));

  if (!snap.exists()) {
    throw new Error("Product not found");
  }

  const product = snap.data();

  if (!product.active) {
    throw new Error("Product is currently unavailable");
  }

  return product;
}

export async function getAnyActiveProduct() {
  const q = query(
    collection(db, "products"),
    where("active", "==", true),
    limit(1)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error("No active products available");
  }

  const doc = snap.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  };
}
