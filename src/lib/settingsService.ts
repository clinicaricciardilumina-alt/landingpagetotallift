import { db } from "./firebaseService";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { cleanForFirestore } from "./firestoreUtils";
import type { AppSettings } from "../types";

const SETTINGS_DOC = doc(db, "appSettings", "global");

const DEFAULT_SETTINGS: AppSettings = {
  id: "global",
  chatGloballyEnabled: true,
  notificationsGloballyEnabled: true,
  aiProvider: "gemini",
  geminiModel: "gemini-2.0-flash-exp",
  anthropicModel: "claude-haiku-4-5-20251001",
  emailFromName: "Studio Dentistico",
  brandPrimaryColor: "#0066A1",
  updatedAt: new Date().toISOString(),
};

export const getAppSettings = async (): Promise<AppSettings> => {
  try {
    const d = await getDoc(SETTINGS_DOC);
    if (d.exists()) return { ...DEFAULT_SETTINGS, ...(d.data() as any), id: "global" };
    return DEFAULT_SETTINGS;
  } catch (e) {
    console.error("Errore getAppSettings:", e);
    return DEFAULT_SETTINGS;
  }
};

export const updateAppSettings = async (data: Partial<AppSettings>) => {
  const payload = { ...data, updatedAt: new Date().toISOString() };
  await setDoc(SETTINGS_DOC, cleanForFirestore(payload), { merge: true });
};

/**
 * IMPORTANTE: questa funzione è solo lato CLIENT per UI di configurazione.
 * Il client può salvare la API key in Firestore, ma NON deve mai usarla
 * per chiamate dirette a Anthropic/Resend.
 * Le chiamate vanno fatte attraverso /api/chat e /api/send-email
 * che leggono la key server-side da Firestore.
 */
export const settingsAreConfiguredForChat = (s: AppSettings): boolean => {
  const provider = s.aiProvider || "gemini";
  if (provider === "anthropic") {
    return Boolean(s.anthropicApiKey && s.anthropicApiKey.length > 10);
  }
  return Boolean(s.geminiApiKey && s.geminiApiKey.length > 10);
};

export const settingsAreConfiguredForEmail = (s: AppSettings): boolean => {
  return Boolean(
    s.resendApiKey &&
    s.resendApiKey.length > 10 &&
    s.emailFromAddress &&
    s.emailFromAddress.includes("@")
  );
};
