import { db } from "./firebaseService";
import {
  collection, getDocs, getDoc, setDoc, addDoc, deleteDoc,
  doc, query, where, updateDoc, orderBy, Timestamp
} from "firebase/firestore";
import type {
  LandingPageDoc, Funnel, FunnelQuestion, ContactForm, ThankYouPage,
  BookingSlot, Automation, Lead, EmailTemplate, LeadActionLog, FunnelLevel, LeadStatus
} from "../types";

// =====================================================
// LANDING PAGES
// =====================================================
const LANDINGS_COLL = "landings";

export const getLandings = async (): Promise<LandingPageDoc[]> => {
  try {
    const snap = await getDocs(collection(db, LANDINGS_COLL));
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as LandingPageDoc[];
  } catch (e) {
    console.error("Errore getLandings:", e);
    return [];
  }
};

export const getLandingById = async (id: string): Promise<LandingPageDoc | null> => {
  try {
    const d = await getDoc(doc(db, LANDINGS_COLL, id));
    return d.exists() ? ({ ...(d.data() as any), id: d.id }) : null;
  } catch (e) {
    console.error("Errore getLandingById:", e);
    return null;
  }
};

export const getLandingBySlug = async (slug: string): Promise<LandingPageDoc | null> => {
  try {
    const q = query(collection(db, LANDINGS_COLL), where("slug", "==", slug));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { ...(d.data() as any), id: d.id } as LandingPageDoc;
  } catch (e) {
    console.error("Errore getLandingBySlug:", e);
    return null;
  }
};

export const addLanding = async (landing: Omit<LandingPageDoc, "id">): Promise<LandingPageDoc> => {
  const ref = await addDoc(collection(db, LANDINGS_COLL), landing);
  return { ...landing, id: ref.id };
};

export const updateLanding = async (id: string, data: Partial<LandingPageDoc>) => {
  await updateDoc(doc(db, LANDINGS_COLL, id), { ...data, updatedAt: new Date().toISOString() });
};

export const deleteLanding = async (id: string) => {
  await deleteDoc(doc(db, LANDINGS_COLL, id));
};

// =====================================================
// FUNNELS
// =====================================================
const FUNNELS_COLL = "funnels";

export const getFunnels = async (): Promise<Funnel[]> => {
  try {
    const snap = await getDocs(collection(db, FUNNELS_COLL));
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as Funnel[];
  } catch (e) {
    console.error("Errore getFunnels:", e);
    return [];
  }
};

export const getFunnelById = async (id: string): Promise<Funnel | null> => {
  try {
    const d = await getDoc(doc(db, FUNNELS_COLL, id));
    return d.exists() ? ({ ...(d.data() as any), id: d.id }) : null;
  } catch {
    return null;
  }
};

export const addFunnel = async (funnel: Omit<Funnel, "id">): Promise<Funnel> => {
  const ref = await addDoc(collection(db, FUNNELS_COLL), funnel);
  return { ...funnel, id: ref.id };
};

export const updateFunnel = async (id: string, data: Partial<Funnel>) => {
  await updateDoc(doc(db, FUNNELS_COLL, id), { ...data, updatedAt: new Date().toISOString() });
};

export const deleteFunnel = async (id: string) => {
  await deleteDoc(doc(db, FUNNELS_COLL, id));
};

// =====================================================
// FUNNEL QUESTIONS
// =====================================================
const FUNNEL_QUESTIONS_COLL = "funnelQuestions";

export const getFunnelQuestions = async (): Promise<FunnelQuestion[]> => {
  try {
    const snap = await getDocs(collection(db, FUNNEL_QUESTIONS_COLL));
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as FunnelQuestion[];
  } catch (e) {
    console.error("Errore getFunnelQuestions:", e);
    return [];
  }
};

export const getFunnelQuestionById = async (id: string): Promise<FunnelQuestion | null> => {
  try {
    const d = await getDoc(doc(db, FUNNEL_QUESTIONS_COLL, id));
    return d.exists() ? ({ ...(d.data() as any), id: d.id }) : null;
  } catch {
    return null;
  }
};

export const addFunnelQuestion = async (q: Omit<FunnelQuestion, "id">): Promise<FunnelQuestion> => {
  const ref = await addDoc(collection(db, FUNNEL_QUESTIONS_COLL), q);
  return { ...q, id: ref.id };
};

export const updateFunnelQuestion = async (id: string, data: Partial<FunnelQuestion>) => {
  await updateDoc(doc(db, FUNNEL_QUESTIONS_COLL, id), data as any);
};

export const deleteFunnelQuestion = async (id: string) => {
  await deleteDoc(doc(db, FUNNEL_QUESTIONS_COLL, id));
};

// =====================================================
// CONTACT FORMS
// =====================================================
const FORMS_COLL = "contactForms";

export const getContactForms = async (): Promise<ContactForm[]> => {
  try {
    const snap = await getDocs(collection(db, FORMS_COLL));
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as ContactForm[];
  } catch (e) {
    console.error("Errore getContactForms:", e);
    return [];
  }
};

export const getContactFormById = async (id: string): Promise<ContactForm | null> => {
  try {
    const d = await getDoc(doc(db, FORMS_COLL, id));
    return d.exists() ? ({ ...(d.data() as any), id: d.id }) : null;
  } catch {
    return null;
  }
};

export const addContactForm = async (form: Omit<ContactForm, "id">): Promise<ContactForm> => {
  const ref = await addDoc(collection(db, FORMS_COLL), form);
  return { ...form, id: ref.id };
};

export const updateContactForm = async (id: string, data: Partial<ContactForm>) => {
  await updateDoc(doc(db, FORMS_COLL, id), data as any);
};

export const deleteContactForm = async (id: string) => {
  await deleteDoc(doc(db, FORMS_COLL, id));
};

// =====================================================
// THANK YOU PAGES
// =====================================================
const THANKYOU_COLL = "thankYouPages";

export const getThankYouPages = async (): Promise<ThankYouPage[]> => {
  try {
    const snap = await getDocs(collection(db, THANKYOU_COLL));
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as ThankYouPage[];
  } catch (e) {
    console.error("Errore getThankYouPages:", e);
    return [];
  }
};

export const getThankYouPageById = async (id: string): Promise<ThankYouPage | null> => {
  try {
    const d = await getDoc(doc(db, THANKYOU_COLL, id));
    return d.exists() ? ({ ...(d.data() as any), id: d.id }) : null;
  } catch {
    return null;
  }
};

export const addThankYouPage = async (p: Omit<ThankYouPage, "id">): Promise<ThankYouPage> => {
  const ref = await addDoc(collection(db, THANKYOU_COLL), p);
  return { ...p, id: ref.id };
};

export const updateThankYouPage = async (id: string, data: Partial<ThankYouPage>) => {
  await updateDoc(doc(db, THANKYOU_COLL, id), data as any);
};

export const deleteThankYouPage = async (id: string) => {
  await deleteDoc(doc(db, THANKYOU_COLL, id));
};

// =====================================================
// BOOKING SLOTS (V2)
// =====================================================
const BOOKING_SLOTS_COLL = "bookingSlots";

export const getBookingSlots = async (): Promise<BookingSlot[]> => {
  try {
    const snap = await getDocs(collection(db, BOOKING_SLOTS_COLL));
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as BookingSlot[];
  } catch (e) {
    console.error("Errore getBookingSlots:", e);
    return [];
  }
};

export const addBookingSlot = async (slot: Omit<BookingSlot, "id">): Promise<BookingSlot> => {
  const ref = await addDoc(collection(db, BOOKING_SLOTS_COLL), slot);
  return { ...slot, id: ref.id };
};

export const updateBookingSlot = async (id: string, data: Partial<BookingSlot>) => {
  await updateDoc(doc(db, BOOKING_SLOTS_COLL, id), data as any);
};

export const deleteBookingSlot = async (id: string) => {
  await deleteDoc(doc(db, BOOKING_SLOTS_COLL, id));
};

export const incrementBookingSlot = async (id: string) => {
  const d = await getDoc(doc(db, BOOKING_SLOTS_COLL, id));
  if (!d.exists()) return;
  const data = d.data() as BookingSlot;
  const current = (data.currentBookings || 0) + 1;
  const status = current >= data.maxBookings ? "pieno" : "disponibile";
  await updateDoc(doc(db, BOOKING_SLOTS_COLL, id), {
    currentBookings: current,
    status,
  } as any);
};

// =====================================================
// AUTOMATIONS
// =====================================================
const AUTOMATIONS_COLL = "automations";

export const getAutomations = async (): Promise<Automation[]> => {
  try {
    const snap = await getDocs(collection(db, AUTOMATIONS_COLL));
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as Automation[];
  } catch (e) {
    console.error("Errore getAutomations:", e);
    return [];
  }
};

export const addAutomation = async (a: Omit<Automation, "id">): Promise<Automation> => {
  const ref = await addDoc(collection(db, AUTOMATIONS_COLL), a);
  return { ...a, id: ref.id };
};

export const updateAutomation = async (id: string, data: Partial<Automation>) => {
  await updateDoc(doc(db, AUTOMATIONS_COLL, id), data as any);
};

export const deleteAutomation = async (id: string) => {
  await deleteDoc(doc(db, AUTOMATIONS_COLL, id));
};

// =====================================================
// LEADS
// =====================================================
const LEADS_COLL = "leads";

export const getLeads = async (): Promise<Lead[]> => {
  try {
    const snap = await getDocs(collection(db, LEADS_COLL));
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as Lead[];
  } catch (e) {
    console.error("Errore getLeads:", e);
    return [];
  }
};

export const getLeadById = async (id: string): Promise<Lead | null> => {
  try {
    const d = await getDoc(doc(db, LEADS_COLL, id));
    return d.exists() ? ({ ...(d.data() as any), id: d.id }) : null;
  } catch {
    return null;
  }
};

export const addLead = async (lead: Omit<Lead, "id">): Promise<Lead> => {
  const ref = await addDoc(collection(db, LEADS_COLL), lead);
  return { ...lead, id: ref.id };
};

export const updateLead = async (id: string, data: Partial<Lead>) => {
  await updateDoc(doc(db, LEADS_COLL, id), { ...data, updatedAt: new Date().toISOString() } as any);
};

export const deleteLead = async (id: string) => {
  await deleteDoc(doc(db, LEADS_COLL, id));
};

export const addLeadActionLog = async (leadId: string, log: Omit<LeadActionLog, "id">) => {
  const lead = await getLeadById(leadId);
  if (!lead) return;
  const newLog: LeadActionLog = { ...log, id: `log_${Date.now()}` };
  const updatedLog = [...(lead.actionLog || []), newLog];
  await updateLead(leadId, { actionLog: updatedLog });
};

export const updateLeadStatus = async (leadId: string, status: LeadStatus) => {
  await updateLead(leadId, { status });
  await addLeadActionLog(leadId, {
    type: "status_changed",
    description: `Stato cambiato in: ${status}`,
    timestamp: new Date().toISOString(),
  });
};

export const updateLeadLevel = async (leadId: string, level: FunnelLevel) => {
  await updateLead(leadId, { funnelLevel: level });
  await addLeadActionLog(leadId, {
    type: "level_changed",
    description: `Livello funnel cambiato in: ${level}`,
    timestamp: new Date().toISOString(),
  });
};

// =====================================================
// EMAIL TEMPLATES
// =====================================================
const EMAIL_TEMPLATES_COLL = "emailTemplates";

export const getEmailTemplates = async (): Promise<EmailTemplate[]> => {
  try {
    const snap = await getDocs(collection(db, EMAIL_TEMPLATES_COLL));
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as EmailTemplate[];
  } catch {
    return [];
  }
};

export const addEmailTemplate = async (t: Omit<EmailTemplate, "id">): Promise<EmailTemplate> => {
  const ref = await addDoc(collection(db, EMAIL_TEMPLATES_COLL), t);
  return { ...t, id: ref.id };
};

export const updateEmailTemplate = async (id: string, data: Partial<EmailTemplate>) => {
  await updateDoc(doc(db, EMAIL_TEMPLATES_COLL, id), data as any);
};

export const deleteEmailTemplate = async (id: string) => {
  await deleteDoc(doc(db, EMAIL_TEMPLATES_COLL, id));
};
