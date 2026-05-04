import { db } from "../firebase";
import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore";

export async function getSettings() {
  const docSnap = await getDoc(doc(db, "settings", "landing"));
  return docSnap.exists() ? docSnap.data() : null;
}

export async function saveSettings(data: any) {
  await setDoc(doc(db, "settings", "landing"), data);
}

export async function getQuestions() {
  const snapshot = await getDocs(collection(db, "questions"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addQuestion(data: any) {
  return await addDoc(collection(db, "questions"), { ...data, id: Date.now() });
}

export async function updateQuestion(id: string, data: any) {
  await updateDoc(doc(db, "questions", id), data);
}

export async function deleteQuestion(id: string) {
  await deleteDoc(doc(db, "questions", id));
}

export async function getSlots() {
  const snapshot = await getDocs(collection(db, "slots"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addSlot(data: any) {
  return await addDoc(collection(db, "slots"), { ...data, booked: 0 });
}

export async function deleteSlot(id: string) {
  await deleteDoc(doc(db, "slots", id));
}

export async function getBookings() {
  const snapshot = await getDocs(collection(db, "bookings"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addBooking(data: any) {
  return await addDoc(collection(db, "bookings"), { ...data, created_at: new Date().toISOString() });
}

export async function getStats() {
  const bookings = await getBookings();
  const paid = bookings.filter((b: any) => b.payment_status === "paid").length;
  return { total_bookings: bookings.length, paid_bookings: paid };
}
