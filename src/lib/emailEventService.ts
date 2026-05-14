import { db } from "./firebaseService";
import {
  collection, getDocs, addDoc, query, where, orderBy, limit,
} from "firebase/firestore";
import { cleanForFirestore } from "./firestoreUtils";
import type { EmailEvent, EmailEventType } from "../types";

const COLL = "emailEvents";

export const getEmailEvents = async (max: number = 500): Promise<EmailEvent[]> => {
  try {
    const q = query(collection(db, COLL), orderBy("occurredAt", "desc"), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as EmailEvent[];
  } catch (e) {
    console.error("Errore getEmailEvents:", e);
    return [];
  }
};

export const getEmailEventsByLead = async (leadId: string): Promise<EmailEvent[]> => {
  try {
    const q = query(collection(db, COLL), where("leadId", "==", leadId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as EmailEvent[];
  } catch {
    return [];
  }
};

export const getEmailEventsByBroadcast = async (broadcastId: string): Promise<EmailEvent[]> => {
  try {
    const q = query(collection(db, COLL), where("broadcastId", "==", broadcastId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as EmailEvent[];
  } catch {
    return [];
  }
};

export const addEmailEvent = async (event: Omit<EmailEvent, "id">): Promise<EmailEvent> => {
  const ref = await addDoc(collection(db, COLL), cleanForFirestore(event));
  return { ...event, id: ref.id };
};

/**
 * Aggrega gli eventi per ottenere le metriche di un'email/broadcast.
 */
export interface EmailMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;       // %
  clickRate: number;      // %
  bounceRate: number;     // %
}

export const calculateMetrics = (events: EmailEvent[]): EmailMetrics => {
  const counts: Record<EmailEventType, number> = {
    sent: 0, delivered: 0, opened: 0, clicked: 0,
    bounced: 0, complained: 0, unsubscribed: 0,
  };
  for (const e of events) counts[e.eventType]++;

  const sent = counts.sent || counts.delivered;
  return {
    sent,
    delivered: counts.delivered,
    opened: counts.opened,
    clicked: counts.clicked,
    bounced: counts.bounced,
    unsubscribed: counts.unsubscribed,
    openRate: sent > 0 ? Math.round((counts.opened / sent) * 100) : 0,
    clickRate: sent > 0 ? Math.round((counts.clicked / sent) * 100) : 0,
    bounceRate: sent > 0 ? Math.round((counts.bounced / sent) * 100) : 0,
  };
};
