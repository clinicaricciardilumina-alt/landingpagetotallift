/**
 * Vercel Serverless Function: /api/send-email
 *
 * Riceve dal client una richiesta di invio email (notifica interna).
 * Lato server:
 * 1. Recupera la API key Resend da Firestore
 * 2. Invia l'email
 * 3. Salva un log su Firestore (collezione notificationLogs)
 *
 * Se la API key non è configurata, salva comunque il log con status="stub"
 * così il sistema funziona in modalità "preview" anche senza email reali.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function getFirebaseAdmin() {
  if (getApps().length === 0) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountJson) {
      try {
        initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
      } catch {
        initializeApp();
      }
    } else {
      initializeApp();
    }
  }
  return getFirestore();
}

interface SendEmailPayload {
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html?: string;
  text?: string;
  // metadata per il log
  ruleId?: string;
  ruleName?: string;
  trigger?: string;
  leadId?: string;
  landingId?: string;
  funnelId?: string;
  conversationId?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = req.body as SendEmailPayload;
    if (!payload?.to || !payload?.subject || (!payload?.html && !payload?.text)) {
      return res.status(400).json({ error: "to, subject, and html/text required" });
    }

    const fs = getFirebaseAdmin();
    const settingsSnap = await fs.collection("appSettings").doc("global").get();
    const settings = settingsSnap.exists ? (settingsSnap.data() as any) : {};

    const apiKey = settings.resendApiKey || process.env.RESEND_API_KEY;
    const fromAddress = settings.emailFromAddress || process.env.RESEND_FROM_EMAIL;
    const fromName = settings.emailFromName || "Studio";

    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];

    // ----- Modalità STUB: niente API key → log con status="stub" -----
    if (!apiKey || !fromAddress) {
      const logRef = await fs.collection("notificationLogs").add({
        ruleId: payload.ruleId || null,
        ruleName: payload.ruleName || "",
        trigger: payload.trigger || "manual",
        recipients,
        subject: payload.subject,
        bodyPreview: (payload.text || payload.html || "").slice(0, 200),
        status: "stub",
        provider: "stub",
        leadId: payload.leadId || null,
        landingId: payload.landingId || null,
        funnelId: payload.funnelId || null,
        conversationId: payload.conversationId || null,
        sentAt: new Date().toISOString(),
      });

      return res.status(200).json({
        ok: true,
        stub: true,
        message: "Email salvata in modalità stub (configura Resend API key per invio reale)",
        logId: logRef.id,
      });
    }

    // ----- Invio reale tramite Resend -----
    const resend = new Resend(apiKey);
    const fromHeader = fromName ? `${fromName} <${fromAddress}>` : fromAddress;

    const result = await resend.emails.send({
      from: fromHeader,
      to: recipients,
      cc: payload.cc,
      bcc: payload.bcc,
      reply_to: settings.emailReplyTo,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    } as any);

    const messageId = (result as any)?.data?.id || (result as any)?.id;
    const error = (result as any)?.error;

    const logRef = await fs.collection("notificationLogs").add({
      ruleId: payload.ruleId || null,
      ruleName: payload.ruleName || "",
      trigger: payload.trigger || "manual",
      recipients,
      subject: payload.subject,
      bodyPreview: (payload.text || payload.html || "").slice(0, 200),
      status: error ? "failed" : "sent",
      errorMessage: error ? JSON.stringify(error) : null,
      provider: "resend",
      providerMessageId: messageId || null,
      leadId: payload.leadId || null,
      landingId: payload.landingId || null,
      funnelId: payload.funnelId || null,
      conversationId: payload.conversationId || null,
      sentAt: new Date().toISOString(),
    });

    if (error) {
      return res.status(500).json({ ok: false, error, logId: logRef.id });
    }

    return res.status(200).json({ ok: true, messageId, logId: logRef.id });
  } catch (error: any) {
    console.error("Send email error:", error);
    return res.status(500).json({ error: error?.message || "Internal error" });
  }
}
