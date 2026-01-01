import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase client configuration
const firebaseConfig = {
  apiKey: "AIzaSyAaEophX-xzaAUDgOGW9KJ909G05G8zm1c",
  authDomain: "justcook-5f0af.firebaseapp.com",
  projectId: "justcook-5f0af",
  storageBucket: "justcook-5f0af.firebasestorage.app",
  messagingSenderId: "1079264534356",
  appId: "1:1079264534356:web:c528454a659a29d959b2c1",
};

// ✅ IMPORTANT: export the app
export const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Optional helpers
export const auth = getAuth(app);
export const db = getFirestore(app);
