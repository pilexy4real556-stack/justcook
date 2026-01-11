import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: "justcook-5f0af.firebaseapp.com",
  projectId: "justcook-5f0af",
  storageBucket: "justcook-5f0af.appspot.com",
  messagingSenderId: "1079264534356",
  appId: "1:1079264534356:web:xxxxxxxx"
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
