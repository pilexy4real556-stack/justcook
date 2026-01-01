import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "justcook-5f0af.firebaseapp.com",
  projectId: "justcook-5f0af",
  storageBucket: "justcook-5f0af.appspot.com",
  messagingSenderId: "1079...",
  appId: "1:1079:web:..."
};

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
