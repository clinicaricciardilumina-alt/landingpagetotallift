import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, getDoc, setDoc, addDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  projectId: "landing-total",
  apiKey: "AIzaSyAUGpj7Fn6WMqCn4rNHaVYxH-K0c6jRb8I",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// SETTINGS
export const getSettings = async () => {
  try {
    const docSnap = await getDoc(doc(db, "settings", "main"));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (e) {
    console.error("Errore getSettings:", e);
    return null;
  }
};

export const subscribeToSettings = (callback: (settings: any) => void) => {
  try {
    return onSnapshot(doc(db, "settings", "main"), (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      }
    });
  } catch (e) {
    console.error("Errore subscribe:", e);
    return () => {};
  }
};

export const saveSettings = async (settings: any) => {
  try {
    await setDoc(doc(db, "settings", "main"), settings);
  } catch (e) {
    console.error("Errore saveSettings:", e);
    throw e;
  }
};

// QUESTIONS
export const getQuestions = async () => {
  try {
    const snapshot = await getDocs(collection(db, "questions"));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (e) {
    console.error("Errore getQuestions:", e);
    return [];
  }
};

export const addQuestion = async (question: any) => {
  try {
    const docRef = await addDoc(collection(db, "questions"), question);
    return { ...question, id: docRef.id };
  } catch (e) {
    console.error("Errore addQuestion:", e);
    throw e;
  }
};

export const updateQuestion = async (id: string, question: any) => {
  try {
    await setDoc(doc(db, "questions", id), question);
  } catch (e) {
    console.error("Errore updateQuestion:", e);
    throw e;
  }
};

export const deleteQuestion = async (id: string) => {
  try {
    await deleteDoc(doc(db, "questions", id));
  } catch (e) {
    console.error("Errore deleteQuestion:", e);
    throw e;
  }
};

// SLOTS
export const getSlots = async () => {
  try {
    const snapshot = await getDocs(collection(db, "slots"));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (e) {
    console.error("Errore getSlots:", e);
    return [];
  }
};

export const generateSlots = async (config: any) => {
  try {
    const { dates, morningStart, morningEnd, afternoonStart, afternoonEnd, duration, pause } = config;
    const slots = [];

    for (const date of dates) {
      const timeSlots = [];

      if (morningStart && morningEnd) {
        timeSlots.push(...generateTimeSlots(morningStart, morningEnd, duration, pause));
      }
      if (afternoonStart && afternoonEnd) {
        timeSlots.push(...generateTimeSlots(afternoonStart, afternoonEnd, duration, pause));
      }

      for (const time of timeSlots) {
        const slot = {
          date,
          time,
          duration,
          isBlocked: false,
          createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, "slots"), slot);
        slots.push({ ...slot, id: docRef.id });
      }
    }
    return slots;
  } catch (e) {
    console.error("Errore generateSlots:", e);
    throw e;
  }
};

export const toggleSlotStatus = async (id: string, isBlocked: boolean) => {
  try {
    await setDoc(doc(db, "slots", id), { isBlocked }, { merge: true });
  } catch (e) {
    console.error("Errore toggleSlotStatus:", e);
    throw e;
  }
};

export const deleteSlot = async (id: string) => {
  try {
    await deleteDoc(doc(db, "slots", id));
  } catch (e) {
    console.error("Errore deleteSlot:", e);
    throw e;
  }
};

function generateTimeSlots(start: string, end: string, duration: number, pause: number): string[] {
  const slots = [];
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);

  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes + duration <= endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    currentMinutes += duration + pause;
  }

  return slots;
}

// BOOKINGS
export const getBookings = async () => {
  try {
    const snapshot = await getDocs(collection(db, "bookings"));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (e) {
    console.error("Errore getBookings:", e);
    return [];
  }
};

export const addBooking = async (booking: any) => {
  try {
    const docRef = await addDoc(collection(db, "bookings"), booking);
    return { ...booking, id: docRef.id };
  } catch (e) {
    console.error("Errore addBooking:", e);
    throw e;
  }
};

// STATS
export const getStats = async () => {
  try {
    const snapshot = await getDocs(collection(db, "bookings"));
    const bookings = snapshot.docs.map(doc => doc.data());
    const total_bookings = bookings.length;
    const paid_bookings = bookings.filter(b => b.payment_status === "paid").length;
    return { total_bookings, paid_bookings };
  } catch (e) {
    console.error("Errore getStats:", e);
    return { total_bookings: 0, paid_bookings: 0 };
  }
};

// PAGE BUILDER
export async function savePageBuilder(pageData: any) {
  try {
    const docRef = doc(db, "pageBuilder", "main");
    await setDoc(docRef, pageData, { merge: true });
    console.log("Page Builder salvato con successo");
    return pageData;
  } catch (error) {
    console.error("Errore nel salvataggio del Page Builder:", error);
    throw error;
  }
}

// BUILDER - Automazioni
export async function saveAutomation(automationData: any): Promise<void> {
  try {
    const docRef = doc(db, "automazioni", "automations", automationData.id);
    await setDoc(docRef, automationData, { merge: true });
    console.log("Automation salvata con successo");
  } catch (error) {
    console.error("Errore nel salvataggio dell'Automation:", error);
    throw error;
  }
}

export async function getAutomations(): Promise<any[]> {
  try {
    const snapshot = await getDocs(collection(db, "automazioni", "automations"));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error("Errore nel caricamento delle Automazioni:", error);
    return [];
  }
}

// Type definitions for Builder
export type LandingSettings = any;
export type Question = any;
export type BookingSlot = any;
export type Booking = any;
export type Statistics = any;
