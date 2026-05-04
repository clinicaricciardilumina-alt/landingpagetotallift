import { db } from "../firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  QueryConstraint
} from "firebase/firestore";

// Settings
export async function getSettings() {
  try {
    const docSnap = await getDoc(doc(db, "settings", "landing"));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (e) {
    console.error("Errore getSettings:", e);
    return null;
  }
}

export async function saveSettings(data: any) {
  try {
    await setDoc(doc(db, "settings", "landing"), data);
  } catch (e) {
    console.error("Errore saveSettings:", e);
  }
}

// Questions
export async function getQuestions() {
  try {
    const snapshot = await getDocs(collection(db, "questions"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Errore getQuestions:", e);
    return [];
  }
}

export async function addQuestion(data: any) {
  try {
    return await addDoc(collection(db, "questions"), { ...data, id: Date.now() });
  } catch (e) {
    console.error("Errore addQuestion:", e);
  }
}

export async function updateQuestion(id: string, data: any) {
  try {
    await updateDoc(doc(db, "questions", id), data);
  } catch (e) {
    console.error("Errore updateQuestion:", e);
  }
}

export async function deleteQuestion(id: string) {
  try {
    await deleteDoc(doc(db, "questions", id));
  } catch (e) {
    console.error("Errore deleteQuestion:", e);
  }
}

// Slots
export async function getSlots() {
  try {
    const snapshot = await getDocs(collection(db, "slots"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Errore getSlots:", e);
    return [];
  }
}

export async function addSlot(data: any) {
  try {
    return await addDoc(collection(db, "slots"), { ...data, booked: 0 });
  } catch (e) {
    console.error("Errore addSlot:", e);
  }
}

export async function deleteSlot(id: string) {
  try {
    await deleteDoc(doc(db, "slots", id));
  } catch (e) {
    console.error("Errore deleteSlot:", e);
  }
}

// Bookings
export async function getBookings() {
  try {
    const snapshot = await getDocs(collection(db, "bookings"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Errore getBookings:", e);
    return [];
  }
}

export async function addBooking(data: any) {
  try {
    return await addDoc(collection(db, "bookings"), { 
      ...data, 
      created_at: new Date().toISOString() 
    });
  } catch (e) {
    console.error("Errore addBooking:", e);
  }
}

// Stats
export async function getStats() {
  try {
    const bookings = await getBookings();
    const paid = bookings.filter((b: any) => b.payment_status === "paid").length;
    return { 
      total_bookings: bookings.length, 
      paid_bookings: paid 
    };
  } catch (e) {
    console.error("Errore getStats:", e);
    return { total_bookings: 0, paid_bookings: 0 };
  }
}
