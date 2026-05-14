import { db } from "./firebaseService";
import {
  collection, getDocs, getDoc, addDoc, deleteDoc,
  doc, updateDoc, query, orderBy,
} from "firebase/firestore";
import { cleanForFirestore } from "./firestoreUtils";
import type { EmailTemplateV2 } from "../types";

const COLL = "emailTemplatesV2";

export const getEmailTemplates = async (): Promise<EmailTemplateV2[]> => {
  try {
    const snap = await getDocs(query(collection(db, COLL), orderBy("updatedAt", "desc")));
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as EmailTemplateV2[];
  } catch (e) {
    console.error("Errore getEmailTemplates:", e);
    return [];
  }
};

export const getEmailTemplateById = async (id: string): Promise<EmailTemplateV2 | null> => {
  try {
    const d = await getDoc(doc(db, COLL, id));
    return d.exists() ? ({ ...(d.data() as any), id: d.id }) : null;
  } catch {
    return null;
  }
};

export const addEmailTemplate = async (
  tpl: Omit<EmailTemplateV2, "id" | "createdAt" | "updatedAt">
): Promise<EmailTemplateV2> => {
  const now = new Date().toISOString();
  const payload = { ...tpl, createdAt: now, updatedAt: now };
  const ref = await addDoc(collection(db, COLL), cleanForFirestore(payload));
  return { ...payload, id: ref.id };
};

export const updateEmailTemplate = async (id: string, data: Partial<EmailTemplateV2>) => {
  const payload = { ...data, updatedAt: new Date().toISOString() };
  await updateDoc(doc(db, COLL, id), cleanForFirestore(payload) as any);
};

export const deleteEmailTemplate = async (id: string) => {
  await deleteDoc(doc(db, COLL, id));
};

/**
 * Renderizza un template (sostituisce le variabili) in oggetto + body.
 */
export const renderTemplateForEmail = (
  tpl: EmailTemplateV2,
  variables: Record<string, any>
): { subject: string; html: string; text: string } => {
  const replaceVars = (text: string): string =>
    text.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_m, k) => {
      const v = variables[k];
      if (v === undefined || v === null) return "";
      return String(v);
    });

  const subject = replaceVars(tpl.subject);

  if (tpl.editorMode === "html" && tpl.bodyHtml) {
    const html = replaceVars(tpl.bodyHtml);
    // Strip HTML for fallback text version
    const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
    return { subject, html, text };
  }

  // Simple mode → genera HTML semplice
  const bodyText = replaceVars(tpl.bodyText || "");
  const ctaLabel = tpl.ctaButtonLabel ? replaceVars(tpl.ctaButtonLabel) : "";
  const ctaUrl = tpl.ctaButtonUrl ? replaceVars(tpl.ctaButtonUrl) : "";
  const footer = tpl.footerText ? replaceVars(tpl.footerText) : "";
  const headerImage = tpl.headerImageUrl || "";

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;padding:20px;background:#ffffff;">
    ${headerImage ? `<img src="${headerImage}" alt="" style="width:100%;display:block;margin-bottom:20px;">` : ""}
    <div style="font-size:16px;line-height:1.6;color:#333;white-space:pre-wrap;">${bodyText}</div>
    ${ctaLabel && ctaUrl ? `
      <div style="text-align:center;margin:30px 0;">
        <a href="${ctaUrl}" style="background:#0066A1;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">${ctaLabel}</a>
      </div>` : ""}
    ${footer ? `<div style="font-size:12px;color:#888;border-top:1px solid #eee;padding-top:20px;margin-top:30px;">${footer}</div>` : ""}
  </div>
</body></html>`;

  const text = `${bodyText}\n\n${ctaLabel && ctaUrl ? `${ctaLabel}: ${ctaUrl}\n\n` : ""}${footer}`;

  return { subject, html, text };
};
