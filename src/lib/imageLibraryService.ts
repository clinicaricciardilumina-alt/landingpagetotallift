import { db } from "./firebaseService";
import {
  collection, getDocs, getDoc, addDoc, deleteDoc,
  doc, updateDoc, query, orderBy, where,
} from "firebase/firestore";
import { cleanForFirestore } from "./firestoreUtils";
import * as settingsService from "./settingsService";
import type { LibraryImage, ImageCategory } from "../types";

const COLL = "imageLibrary";

// =====================================================
// FIRESTORE CRUD
// =====================================================

export const getLibraryImages = async (): Promise<LibraryImage[]> => {
  try {
    const snap = await getDocs(query(collection(db, COLL), orderBy("uploadedAt", "desc")));
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as LibraryImage[];
  } catch (e) {
    console.error("Errore getLibraryImages:", e);
    return [];
  }
};

export const getLibraryImagesByCategory = async (category: ImageCategory): Promise<LibraryImage[]> => {
  try {
    const q = query(collection(db, COLL), where("category", "==", category));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as LibraryImage[];
  } catch {
    return [];
  }
};

export const getLibraryImageById = async (id: string): Promise<LibraryImage | null> => {
  try {
    const d = await getDoc(doc(db, COLL, id));
    return d.exists() ? ({ ...(d.data() as any), id: d.id }) : null;
  } catch {
    return null;
  }
};

export const addLibraryImage = async (
  data: Omit<LibraryImage, "id" | "uploadedAt">
): Promise<LibraryImage> => {
  const payload = { ...data, uploadedAt: new Date().toISOString() };
  const ref = await addDoc(collection(db, COLL), cleanForFirestore(payload));
  return { ...payload, id: ref.id };
};

export const updateLibraryImage = async (id: string, data: Partial<LibraryImage>) => {
  await updateDoc(doc(db, COLL, id), cleanForFirestore(data) as any);
};

export const deleteLibraryImage = async (id: string) => {
  await deleteDoc(doc(db, COLL, id));
};

// =====================================================
// CLOUDINARY UPLOAD
// =====================================================

export interface CloudinaryUploadResult {
  ok: boolean;
  url?: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  error?: string;
}

/**
 * Carica un file su Cloudinary usando le impostazioni globali.
 * Restituisce i dettagli dell'immagine caricata.
 */
export const uploadToCloudinary = async (file: File): Promise<CloudinaryUploadResult> => {
  try {
    const settings = await settingsService.getAppSettings();
    const cloudName = settings.cloudinaryCloudName;
    const uploadPreset = settings.cloudinaryUploadPreset;
    const folder = settings.cloudinaryFolder || "landing_pages";

    if (!cloudName || !uploadPreset) {
      return {
        ok: false,
        error: "Cloudinary non configurato. Vai in Sistema → Impostazioni → Cloudinary",
      };
    }

    if (!file.type.startsWith("image/")) {
      return { ok: false, error: "Per favore seleziona un'immagine" };
    }

    if (file.size > 10 * 1024 * 1024) {
      return { ok: false, error: "Immagine troppo grande (max 10MB)" };
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    if (folder) formData.append("folder", folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        ok: false,
        error: errData.error?.message || `Errore upload (${res.status})`,
      };
    }

    const data = await res.json();
    return {
      ok: true,
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
      bytes: data.bytes,
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Errore di rete" };
  }
};

/**
 * Carica un file su Cloudinary E salva la voce nell'archivio Firestore.
 */
export const uploadAndSaveToLibrary = async (
  file: File,
  metadata: {
    name: string;
    category: ImageCategory;
    tags?: string[];
    description?: string;
    altText?: string;
  }
): Promise<{ ok: boolean; image?: LibraryImage; error?: string }> => {
  const upload = await uploadToCloudinary(file);
  if (!upload.ok || !upload.url || !upload.publicId) {
    return { ok: false, error: upload.error };
  }

  try {
    const image = await addLibraryImage({
      name: metadata.name,
      url: upload.url,
      publicId: upload.publicId,
      category: metadata.category,
      tags: metadata.tags || [],
      width: upload.width,
      height: upload.height,
      format: upload.format,
      bytes: upload.bytes,
      description: metadata.description,
      altText: metadata.altText,
    });
    return { ok: true, image };
  } catch (e: any) {
    return { ok: false, error: `Upload OK ma errore salvataggio: ${e?.message}` };
  }
};

// =====================================================
// HELPERS
// =====================================================

/**
 * Filtra immagini per categoria + tags.
 */
export const filterImages = (
  images: LibraryImage[],
  filters: {
    category?: ImageCategory;
    tags?: string[];
    searchText?: string;
  }
): LibraryImage[] => {
  return images.filter(img => {
    if (filters.category && img.category !== filters.category) return false;
    if (filters.tags?.length) {
      const hasMatch = filters.tags.some(t => (img.tags || []).includes(t));
      if (!hasMatch) return false;
    }
    if (filters.searchText) {
      const text = filters.searchText.toLowerCase();
      const matchName = (img.name || "").toLowerCase().includes(text);
      const matchDesc = (img.description || "").toLowerCase().includes(text);
      const matchTags = (img.tags || []).some(t => t.toLowerCase().includes(text));
      if (!matchName && !matchDesc && !matchTags) return false;
    }
    return true;
  });
};

/**
 * Costruisce URL Cloudinary con trasformazioni (resize, ottimizzazione).
 */
export const buildOptimizedUrl = (
  publicId: string,
  cloudName: string,
  options: {
    width?: number;
    height?: number;
    quality?: "auto" | number;
    format?: "auto" | "webp" | "jpg";
    crop?: "fill" | "fit" | "scale";
  } = {}
): string => {
  const parts: string[] = [];
  if (options.width) parts.push(`w_${options.width}`);
  if (options.height) parts.push(`h_${options.height}`);
  if (options.crop) parts.push(`c_${options.crop}`);
  parts.push(`q_${options.quality || "auto"}`);
  parts.push(`f_${options.format || "auto"}`);
  const transforms = parts.join(",");
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms}/${publicId}`;
};
