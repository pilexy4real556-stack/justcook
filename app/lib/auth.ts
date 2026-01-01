import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../src/lib/firebase";
import { getAuth, signInAnonymously } from "firebase/auth";

export async function getUserRole() {
  const user = auth.currentUser;
  if (!user) return null;

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) return null;

  return snap.data().role as string;
}

export async function ensureAnonymousUser() {
  const auth = getAuth();

  if (!auth.currentUser) {
    const result = await signInAnonymously(auth);
    return result.user.uid;
  }

  return auth.currentUser.uid;
}
