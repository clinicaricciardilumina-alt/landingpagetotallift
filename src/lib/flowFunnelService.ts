import { db } from "./firebaseService";
import {
  collection, getDocs, getDoc, addDoc, deleteDoc,
  doc, updateDoc,
} from "firebase/firestore";
import { cleanForFirestore } from "./firestoreUtils";
import type { FlowFunnel } from "../types";

const COLL = "flowFunnels";

export const getFlowFunnels = async (): Promise<FlowFunnel[]> => {
  try {
    const snap = await getDocs(collection(db, COLL));
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as FlowFunnel[];
  } catch (e) {
    console.error("Errore getFlowFunnels:", e);
    return [];
  }
};

export const getFlowFunnelById = async (id: string): Promise<FlowFunnel | null> => {
  try {
    const d = await getDoc(doc(db, COLL, id));
    return d.exists() ? ({ ...(d.data() as any), id: d.id }) : null;
  } catch {
    return null;
  }
};

export const addFlowFunnel = async (
  funnel: Omit<FlowFunnel, "id" | "createdAt" | "updatedAt">
): Promise<FlowFunnel> => {
  const now = new Date().toISOString();
  const payload = { ...funnel, createdAt: now, updatedAt: now };
  const ref = await addDoc(collection(db, COLL), cleanForFirestore(payload));
  return { ...payload, id: ref.id };
};

export const updateFlowFunnel = async (id: string, data: Partial<FlowFunnel>) => {
  const payload = { ...data, updatedAt: new Date().toISOString() };
  await updateDoc(doc(db, COLL, id), cleanForFirestore(payload) as any);
};

export const deleteFlowFunnel = async (id: string) => {
  await deleteDoc(doc(db, COLL, id));
};

export const duplicateFlowFunnel = async (id: string): Promise<FlowFunnel | null> => {
  const orig = await getFlowFunnelById(id);
  if (!orig) return null;
  const { id: _omit, createdAt: _c, updatedAt: _u, ...rest } = orig;
  return addFlowFunnel({ ...rest, name: `${orig.name} (copia)`, status: "bozza" });
};
