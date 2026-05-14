import { db } from "./firebaseService";
import {
  collection, getDocs, getDoc, doc, setDoc,
} from "firebase/firestore";
import { cleanForFirestore } from "./firestoreUtils";
import type { GoogleReviewsCache, GoogleReviewItem } from "../types";

const COLL = "googleReviewsCache";
const SINGLETON_ID = "global";

/**
 * Carica la cache delle recensioni Google.
 * Restituisce null se non c'è cache o se è scaduta.
 */
export const getGoogleReviewsCache = async (): Promise<GoogleReviewsCache | null> => {
  try {
    const d = await getDoc(doc(db, COLL, SINGLETON_ID));
    if (!d.exists()) return null;
    return { ...(d.data() as any), id: d.id } as GoogleReviewsCache;
  } catch (e) {
    console.error("Errore getGoogleReviewsCache:", e);
    return null;
  }
};

/**
 * Verifica se la cache è ancora valida.
 */
export const isCacheValid = (cache: GoogleReviewsCache | null): boolean => {
  if (!cache) return false;
  const ttlHours = cache.ttlHours || 24;
  const cachedAt = new Date(cache.cachedAt).getTime();
  const now = Date.now();
  const elapsed = (now - cachedAt) / (1000 * 60 * 60);
  return elapsed < ttlHours;
};

/**
 * Salva/aggiorna la cache.
 */
export const saveGoogleReviewsCache = async (cache: Omit<GoogleReviewsCache, "id">) => {
  await setDoc(doc(db, COLL, SINGLETON_ID), cleanForFirestore(cache));
};

/**
 * Chiama l'endpoint server-side per fare refresh delle recensioni da Google.
 * Restituisce le nuove recensioni (e aggiorna la cache).
 */
export const refreshGoogleReviews = async (placeId: string): Promise<{
  ok: boolean;
  cache?: GoogleReviewsCache;
  error?: string;
}> => {
  try {
    const res = await fetch("/api/google-reviews-refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId }),
    });
    return await res.json();
  } catch (e: any) {
    return { ok: false, error: e?.message || "Network error" };
  }
};

/**
 * Filtra le recensioni Google per parole chiave (case-insensitive).
 * Se keywords è vuoto, restituisce tutte.
 */
export const filterGoogleReviewsByKeywords = (
  reviews: GoogleReviewItem[],
  keywords: string[] = []
): GoogleReviewItem[] => {
  if (!keywords || keywords.length === 0) return reviews;
  const lower = keywords.map(k => k.toLowerCase().trim()).filter(Boolean);
  if (lower.length === 0) return reviews;
  return reviews.filter(r => {
    const text = (r.text || "").toLowerCase();
    return lower.some(k => text.includes(k));
  });
};
