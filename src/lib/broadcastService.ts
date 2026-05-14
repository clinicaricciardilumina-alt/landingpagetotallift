import { db } from "./firebaseService";
import {
  collection, getDocs, getDoc, addDoc, deleteDoc,
  doc, updateDoc, query, orderBy, limit,
} from "firebase/firestore";
import { cleanForFirestore } from "./firestoreUtils";
import type { BroadcastCampaign, Lead } from "../types";

const COLL = "broadcastCampaigns";

export const getBroadcasts = async (max: number = 100): Promise<BroadcastCampaign[]> => {
  try {
    const q = query(collection(db, COLL), orderBy("updatedAt", "desc"), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as BroadcastCampaign[];
  } catch (e) {
    console.error("Errore getBroadcasts:", e);
    return [];
  }
};

export const getBroadcastById = async (id: string): Promise<BroadcastCampaign | null> => {
  try {
    const d = await getDoc(doc(db, COLL, id));
    return d.exists() ? ({ ...(d.data() as any), id: d.id }) : null;
  } catch {
    return null;
  }
};

export const addBroadcast = async (
  data: Omit<BroadcastCampaign, "id" | "createdAt" | "updatedAt">
): Promise<BroadcastCampaign> => {
  const now = new Date().toISOString();
  const payload = { ...data, createdAt: now, updatedAt: now };
  const ref = await addDoc(collection(db, COLL), cleanForFirestore(payload));
  return { ...payload, id: ref.id };
};

export const updateBroadcast = async (id: string, data: Partial<BroadcastCampaign>) => {
  const payload = { ...data, updatedAt: new Date().toISOString() };
  await updateDoc(doc(db, COLL, id), cleanForFirestore(payload) as any);
};

export const deleteBroadcast = async (id: string) => {
  await deleteDoc(doc(db, COLL, id));
};

/**
 * Filtra i lead in base ai criteri di audience del broadcast.
 */
export const filterLeadsForBroadcast = (
  leads: Lead[],
  filters: BroadcastCampaign["audienceFilters"],
  manuallyIncludedIds: string[] = [],
  manuallyExcludedIds: string[] = []
): Lead[] => {
  let filtered = leads.filter(lead => {
    // Esclusione esplicita
    if (manuallyExcludedIds.includes(lead.id)) return false;
    // Inclusione esplicita: salta i filtri
    if (manuallyIncludedIds.includes(lead.id)) return true;
    // GDPR: marketing consent obbligatorio per broadcast
    if (filters.marketingConsentRequired && !lead.marketingConsent) return false;
    // Esclude unsubscribed (se la flag è in tags)
    if (filters.excludeUnsubscribed && (lead.tags || []).includes("unsubscribed")) return false;
    // Filtri opzionali (ognuno è AND)
    if (filters.landingIds?.length && !filters.landingIds.includes(lead.landingId || "")) return false;
    if (filters.funnelIds?.length && !filters.funnelIds.includes(lead.funnelId || "")) return false;
    if (filters.services?.length) {
      // Service è dedotto da campaignCategory della landing → assumiamo nessun match per ora
      // (se il lead ha "service" come campo custom, lo controlleremo)
    }
    if (filters.funnelLevels?.length && !filters.funnelLevels.includes(lead.funnelLevel)) return false;
    if (filters.statuses?.length && !filters.statuses.includes(lead.status)) return false;
    if (filters.tags?.length) {
      const leadTags = lead.tags || [];
      const hasMatch = filters.tags.some(t => leadTags.includes(t));
      if (!hasMatch) return false;
    }
    return true;
  });

  // Aggiungi manualmente inclusi che non erano nella lista
  const explicitIncludes = leads.filter(l =>
    manuallyIncludedIds.includes(l.id) && !filtered.find(f => f.id === l.id)
  );
  filtered = [...filtered, ...explicitIncludes];

  return filtered;
};

/**
 * Calcola il numero stimato di destinatari (per anteprima)
 */
export const estimateRecipients = (
  leads: Lead[],
  filters: BroadcastCampaign["audienceFilters"],
  includedIds: string[] = [],
  excludedIds: string[] = []
): number => {
  return filterLeadsForBroadcast(leads, filters, includedIds, excludedIds).length;
};
