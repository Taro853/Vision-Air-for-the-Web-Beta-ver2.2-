
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

// Helper to safely access env variables
const getEnv = (key: string, fallback: string) => {
  const meta = import.meta as any;
  if (meta && meta.env && meta.env[key]) {
    return meta.env[key];
  }
  return fallback;
};

// Environment variables or fallback to demo config
const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY", "AIzaSyDI4rz0atXdICK83dLGeN5ssXuHRHEhvUs"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN", "vision-air-ae1e3.firebaseapp.com"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID", "vision-air-ae1e3"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET", "vision-air-ae1e3.firebasestorage.app"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "737540795538"),
  appId: getEnv("VITE_FIREBASE_APP_ID", "1:737540795538:web:a5277ae63241448d930a4b"),
  measurementId: getEnv("VITE_FIREBASE_MEASUREMENT_ID", "G-XEBBPF5FXT")
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export const googleProvider = new GoogleAuthProvider();
