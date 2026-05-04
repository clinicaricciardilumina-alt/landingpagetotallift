import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDuNG4kQOqZ98m1fH9VAUeRTx2RhWN8GEE",
  authDomain: "landing-total.firebaseapp.com",
  projectId: "landing-total",
  storageBucket: "landing-total.firebasestorage.app",
  messagingSenderId: "390284099151",
  appId: "1:390284099151:web:8ba1b706320b3c4acaf43a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
