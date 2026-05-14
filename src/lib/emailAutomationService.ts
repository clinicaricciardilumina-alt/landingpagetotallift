import { db } from "./firebaseService";
import {
  collection, getDocs, getDoc, addDoc, deleteDoc,
  doc, updateDoc, query, where, orderBy, limit,
} from "firebase/firestore";
import { cleanForFirestore } from "./firestoreUtils";
import type {
  EmailAutomation, AutomationEnrollment, AutomationStep,
  AutomationTriggerType, Lead,
} from "../types";

// =====================================================
// AUTOMATIONS CRUD
// =====================================================
const AUTOMATIONS = "emailAutomations";

export const getAutomations = async (): Promise<EmailAutomation[]> => {
  try {
    const snap = await getDocs(collection(db, AUTOMATIONS));
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as EmailAutomation[];
  } catch (e) {
    console.error("Errore getAutomations:", e);
    return [];
  }
};

export const getAutomationById = async (id: string): Promise<EmailAutomation | null> => {
  try {
    const d = await getDoc(doc(db, AUTOMATIONS, id));
    return d.exists() ? ({ ...(d.data() as any), id: d.id }) : null;
  } catch {
    return null;
  }
};

export const addAutomation = async (
  data: Omit<EmailAutomation, "id" | "createdAt" | "updatedAt">
): Promise<EmailAutomation> => {
  const now = new Date().toISOString();
  const payload = { ...data, createdAt: now, updatedAt: now };
  const ref = await addDoc(collection(db, AUTOMATIONS), cleanForFirestore(payload));
  return { ...payload, id: ref.id };
};

export const updateAutomation = async (id: string, data: Partial<EmailAutomation>) => {
  const payload = { ...data, updatedAt: new Date().toISOString() };
  await updateDoc(doc(db, AUTOMATIONS, id), cleanForFirestore(payload) as any);
};

export const deleteAutomation = async (id: string) => {
  await deleteDoc(doc(db, AUTOMATIONS, id));
};

// =====================================================
// MATCHING & ENROLLMENT
// =====================================================

/**
 * Trova le automation che corrispondono a un evento e a un lead specifico.
 */
export const findMatchingAutomations = (
  automations: EmailAutomation[],
  trigger: AutomationTriggerType,
  context: {
    leadFunnelId?: string;
    leadLandingId?: string;
    leadService?: string;
    leadFunnelLevel?: string;
    leadTags?: string[];
    triggerTag?: string;        // Per "tag_added"
  }
): EmailAutomation[] => {
  return automations.filter(a => {
    if (!a.enabled) return false;
    if (a.trigger !== trigger) return false;
    // Filtro tag specifico per "tag_added"
    if (trigger === "tag_added" && a.triggerTagFilter && a.triggerTagFilter !== context.triggerTag) {
      return false;
    }
    // Filtri opzionali
    if (a.filterFunnelId && a.filterFunnelId !== context.leadFunnelId) return false;
    if (a.filterLandingId && a.filterLandingId !== context.leadLandingId) return false;
    if (a.filterService && a.filterService !== context.leadService) return false;
    if (a.filterFunnelLevel && a.filterFunnelLevel !== context.leadFunnelLevel) return false;
    if (a.filterTags && a.filterTags.length > 0) {
      const hasMatch = a.filterTags.some(t => (context.leadTags || []).includes(t));
      if (!hasMatch) return false;
    }
    return true;
  });
};

/**
 * Calcola quando inviare il prossimo step.
 */
export const computeNextScheduledTime = (step: AutomationStep, fromDate: Date = new Date()): Date => {
  const next = new Date(fromDate);
  if (step.delayType === "immediate") {
    return next;
  }
  if (step.delayType === "minutes") {
    next.setMinutes(next.getMinutes() + step.delayValue);
  } else if (step.delayType === "hours") {
    next.setHours(next.getHours() + step.delayValue);
  } else if (step.delayType === "days") {
    next.setDate(next.getDate() + step.delayValue);
  }
  return next;
};

// =====================================================
// ENROLLMENTS CRUD
// =====================================================
const ENROLLMENTS = "automationEnrollments";

export const getEnrollments = async (max: number = 200): Promise<AutomationEnrollment[]> => {
  try {
    const q = query(collection(db, ENROLLMENTS), orderBy("enrolledAt", "desc"), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as AutomationEnrollment[];
  } catch (e) {
    console.error("Errore getEnrollments:", e);
    return [];
  }
};

export const getEnrollmentsByLead = async (leadId: string): Promise<AutomationEnrollment[]> => {
  try {
    const q = query(collection(db, ENROLLMENTS), where("leadId", "==", leadId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as AutomationEnrollment[];
  } catch {
    return [];
  }
};

export const getActiveEnrollments = async (): Promise<AutomationEnrollment[]> => {
  try {
    const q = query(collection(db, ENROLLMENTS), where("status", "==", "active"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as AutomationEnrollment[];
  } catch {
    return [];
  }
};

export const enrollLeadInAutomation = async (
  automation: EmailAutomation,
  lead: Lead
): Promise<AutomationEnrollment | null> => {
  try {
    if (!automation.steps || automation.steps.length === 0) return null;
    const sortedSteps = [...automation.steps].sort((a, b) => a.order - b.order);
    const firstStep = sortedSteps[0];
    const nextScheduled = computeNextScheduledTime(firstStep);

    const enrollment: Omit<AutomationEnrollment, "id"> = {
      automationId: automation.id,
      leadId: lead.id,
      status: "active",
      currentStepOrder: -1,
      nextScheduledAt: nextScheduled.toISOString(),
      stepsCompleted: [],
      enrolledAt: new Date().toISOString(),
    };

    const ref = await addDoc(collection(db, ENROLLMENTS), cleanForFirestore(enrollment));
    return { ...enrollment, id: ref.id };
  } catch (e) {
    console.error("Errore enrollment:", e);
    return null;
  }
};

export const updateEnrollment = async (id: string, data: Partial<AutomationEnrollment>) => {
  await updateDoc(doc(db, ENROLLMENTS, id), cleanForFirestore(data) as any);
};
