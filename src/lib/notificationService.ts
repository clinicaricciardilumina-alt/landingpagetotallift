import { db } from "./firebaseService";
import {
  collection, getDocs, getDoc, addDoc, deleteDoc,
  doc, updateDoc, query, where, orderBy, limit,
} from "firebase/firestore";
import { cleanForFirestore } from "./firestoreUtils";
import type { NotificationRule, NotificationLog, NotificationTriggerType, Lead } from "../types";

// =====================================================
// RULES
// =====================================================
const RULES = "notificationRules";

export const getNotificationRules = async (): Promise<NotificationRule[]> => {
  try {
    const snap = await getDocs(collection(db, RULES));
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as NotificationRule[];
  } catch (e) {
    console.error("Errore getNotificationRules:", e);
    return [];
  }
};

export const addNotificationRule = async (
  rule: Omit<NotificationRule, "id" | "createdAt" | "updatedAt">
): Promise<NotificationRule> => {
  const now = new Date().toISOString();
  const payload = { ...rule, createdAt: now, updatedAt: now };
  const ref = await addDoc(collection(db, RULES), cleanForFirestore(payload));
  return { ...payload, id: ref.id };
};

export const updateNotificationRule = async (id: string, data: Partial<NotificationRule>) => {
  const payload = { ...data, updatedAt: new Date().toISOString() };
  await updateDoc(doc(db, RULES, id), cleanForFirestore(payload) as any);
};

export const deleteNotificationRule = async (id: string) => {
  await deleteDoc(doc(db, RULES, id));
};

// =====================================================
// LOGS
// =====================================================
const LOGS = "notificationLogs";

export const getNotificationLogs = async (max: number = 200): Promise<NotificationLog[]> => {
  try {
    const q = query(collection(db, LOGS), orderBy("sentAt", "desc"), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as NotificationLog[];
  } catch (e) {
    console.error("Errore getNotificationLogs:", e);
    return [];
  }
};

export const addNotificationLog = async (log: Omit<NotificationLog, "id">): Promise<NotificationLog> => {
  const ref = await addDoc(collection(db, LOGS), cleanForFirestore(log));
  return { ...log, id: ref.id };
};

// =====================================================
// MATCHING & TRIGGERING
// =====================================================
/**
 * Trova le regole di notifica che corrispondono a un evento.
 * Filtra per trigger + tutti i filtri opzionali (AND).
 */
export const findMatchingRules = (
  rules: NotificationRule[],
  trigger: NotificationTriggerType,
  context: {
    funnelId?: string;
    landingId?: string;
    service?: string;
    funnelLevel?: string;
    tags?: string[];
  }
): NotificationRule[] => {
  return rules.filter(rule => {
    if (!rule.enabled) return false;
    if (rule.trigger !== trigger) return false;
    if (rule.filterFunnelId && rule.filterFunnelId !== context.funnelId) return false;
    if (rule.filterLandingId && rule.filterLandingId !== context.landingId) return false;
    if (rule.filterService && rule.filterService !== context.service) return false;
    if (rule.filterFunnelLevel && rule.filterFunnelLevel !== context.funnelLevel) return false;
    if (rule.filterTags && rule.filterTags.length > 0) {
      const leadTags = context.tags || [];
      const hasMatch = rule.filterTags.some(t => leadTags.includes(t));
      if (!hasMatch) return false;
    }
    return true;
  });
};

/**
 * Sostituisce le variabili nel template (es. {{nome}}, {{telefono}})
 */
export const renderTemplate = (template: string, vars: Record<string, any>): string => {
  return template.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_match, key) => {
    const v = vars[key];
    if (v === undefined || v === null) return "";
    if (Array.isArray(v)) return v.join(", ");
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  });
};

/**
 * Costruisce le variabili dal Lead per il template email
 */
export const buildVarsFromLead = (
  lead: Lead,
  options: {
    serviceContext?: string;
    chatSummary?: string;
    suggestedAction?: string;
    dashboardUrl?: string;
  } = {}
): Record<string, any> => {
  return {
    nome: `${lead.firstName} ${lead.lastName || ""}`.trim(),
    cognome: lead.lastName || "",
    telefono: lead.phone || "",
    email: lead.email || "",
    landing: lead.landingName || "",
    funnel: lead.funnelName || "",
    servizio: options.serviceContext || "",
    livello_funnel: lead.funnelLevel,
    stato: lead.status,
    tag: (lead.tags || []).join(", "),
    risposte_chat: options.chatSummary || "",
    riepilogo_chat_o_risposte: options.chatSummary || JSON.stringify(lead.answers || {}, null, 2),
    azione_consigliata: options.suggestedAction || "Contattare il lead entro 24h",
    data: new Date(lead.acquiredAt).toLocaleString("it-IT"),
    privacy: lead.privacyConsent ? "Sì" : "No",
    marketing: lead.marketingConsent ? "Sì" : "No",
    link_dashboard: options.dashboardUrl
      ? `${options.dashboardUrl}/dashboard?leadId=${lead.id}`
      : `(dashboard URL non configurato)`,
  };
};
