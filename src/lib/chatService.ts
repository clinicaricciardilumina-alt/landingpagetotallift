import { db } from "./firebaseService";
import {
  collection, getDocs, getDoc, addDoc, deleteDoc,
  doc, updateDoc, query, where, orderBy, limit,
} from "firebase/firestore";
import { cleanForFirestore } from "./firestoreUtils";
import type { ChatBot, ChatConversation } from "../types";

// =====================================================
// CHAT BOTS
// =====================================================
const BOTS = "chatBots";

export const getChatBots = async (): Promise<ChatBot[]> => {
  try {
    const snap = await getDocs(collection(db, BOTS));
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as ChatBot[];
  } catch (e) {
    console.error("Errore getChatBots:", e);
    return [];
  }
};

export const getChatBotById = async (id: string): Promise<ChatBot | null> => {
  try {
    const d = await getDoc(doc(db, BOTS, id));
    return d.exists() ? ({ ...(d.data() as any), id: d.id }) : null;
  } catch (e) {
    console.error("Errore getChatBotById:", e);
    return null;
  }
};

/**
 * Trova il chatbot più appropriato per una landing page.
 * Priorità: bot specifico per landing → bot "showOnAllLandings"
 */
export const getChatBotForLanding = async (landingId: string): Promise<ChatBot | null> => {
  try {
    const bots = await getChatBots();
    const enabledBots = bots.filter(b => b.enabled);
    // Prima cerca bot specifici per la landing
    const specific = enabledBots.find(b =>
      b.showOnLandingIds?.includes(landingId)
    );
    if (specific) return specific;
    // Poi bot globali
    const global = enabledBots.find(b => b.showOnAllLandings);
    return global || null;
  } catch (e) {
    console.error("Errore getChatBotForLanding:", e);
    return null;
  }
};

export const addChatBot = async (
  bot: Omit<ChatBot, "id" | "createdAt" | "updatedAt">
): Promise<ChatBot> => {
  const now = new Date().toISOString();
  const payload = { ...bot, createdAt: now, updatedAt: now };
  const ref = await addDoc(collection(db, BOTS), cleanForFirestore(payload));
  return { ...payload, id: ref.id };
};

export const updateChatBot = async (id: string, data: Partial<ChatBot>) => {
  const payload = { ...data, updatedAt: new Date().toISOString() };
  await updateDoc(doc(db, BOTS, id), cleanForFirestore(payload) as any);
};

export const deleteChatBot = async (id: string) => {
  await deleteDoc(doc(db, BOTS, id));
};

// =====================================================
// CHAT CONVERSATIONS
// =====================================================
const CONV = "chatConversations";

export const getChatConversations = async (): Promise<ChatConversation[]> => {
  try {
    const q = query(collection(db, CONV), orderBy("startedAt", "desc"), limit(500));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as ChatConversation[];
  } catch (e) {
    console.error("Errore getChatConversations:", e);
    return [];
  }
};

export const getConversationById = async (id: string): Promise<ChatConversation | null> => {
  try {
    const d = await getDoc(doc(db, CONV, id));
    return d.exists() ? ({ ...(d.data() as any), id: d.id }) : null;
  } catch {
    return null;
  }
};

export const addConversation = async (
  conv: Omit<ChatConversation, "id">
): Promise<ChatConversation> => {
  const ref = await addDoc(collection(db, CONV), cleanForFirestore(conv));
  return { ...conv, id: ref.id };
};

export const updateConversation = async (id: string, data: Partial<ChatConversation>) => {
  await updateDoc(doc(db, CONV, id), cleanForFirestore(data) as any);
};

export const getConversationsByBot = async (botId: string): Promise<ChatConversation[]> => {
  try {
    const q = query(
      collection(db, CONV),
      where("chatBotId", "==", botId),
      orderBy("startedAt", "desc"),
      limit(200)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as ChatConversation[];
  } catch (e) {
    console.error(e);
    return [];
  }
};
