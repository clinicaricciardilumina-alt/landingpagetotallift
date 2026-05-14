import { db } from "./firebaseService";
import {
  collection, getDocs, getDoc, addDoc, deleteDoc,
  doc, updateDoc, query, orderBy,
} from "firebase/firestore";
import { cleanForFirestore } from "./firestoreUtils";
import type { ManualReview } from "../types";

const COLL = "manualReviews";

export const getManualReviews = async (): Promise<ManualReview[]> => {
  try {
    const snap = await getDocs(query(collection(db, COLL), orderBy("updatedAt", "desc")));
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as ManualReview[];
  } catch (e) {
    console.error("Errore getManualReviews:", e);
    return [];
  }
};

export const getManualReviewById = async (id: string): Promise<ManualReview | null> => {
  try {
    const d = await getDoc(doc(db, COLL, id));
    return d.exists() ? ({ ...(d.data() as any), id: d.id }) : null;
  } catch {
    return null;
  }
};

export const addManualReview = async (
  data: Omit<ManualReview, "id" | "createdAt" | "updatedAt">
): Promise<ManualReview> => {
  const now = new Date().toISOString();
  const payload = { ...data, createdAt: now, updatedAt: now };
  const ref = await addDoc(collection(db, COLL), cleanForFirestore(payload));
  return { ...payload, id: ref.id };
};

export const updateManualReview = async (id: string, data: Partial<ManualReview>) => {
  const payload = { ...data, updatedAt: new Date().toISOString() };
  await updateDoc(doc(db, COLL, id), cleanForFirestore(payload) as any);
};

export const deleteManualReview = async (id: string) => {
  await deleteDoc(doc(db, COLL, id));
};

/**
 * Filtra recensioni per tag servizio.
 * Se tags è vuoto/undefined → restituisce tutte le visibili.
 */
export const filterReviewsByTags = (
  reviews: ManualReview[],
  tags: string[] = []
): ManualReview[] => {
  const visible = reviews.filter(r => r.visible !== false);
  if (!tags || tags.length === 0) return visible;
  return visible.filter(r =>
    (r.serviceTags || []).some(t => tags.includes(t))
  );
};
