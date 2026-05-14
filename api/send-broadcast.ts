/**
 * Vercel Serverless Function: /api/send-broadcast
 *
 * Riceve un broadcastId, calcola l'audience, e invia l'email a tutti i lead.
 * Aggiorna lo stato del broadcast e logga eventi.
 *
 * Richiesta:
 *   POST /api/send-broadcast { broadcastId: string }
 *
 * Risposta:
 *   { ok, totalSent, totalFailed, recipients }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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

function renderTemplate(content: any, vars: Record<string, any>) {
  const replaceVars = (text: string): string =>
    text.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_m, k) => {
      const v = vars[k];
      if (v === undefined || v === null) return "";
      return String(v);
    });

  const subject = replaceVars(content.subject || "");
  let html: string;
  let text: string;

  if (content.editorMode === "html" && content.bodyHtml) {
    html = replaceVars(content.bodyHtml);
    text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  } else {
    const bodyText = replaceVars(content.bodyText || "");
    const ctaLabel = content.ctaButtonLabel ? replaceVars(content.ctaButtonLabel) : "";
    const ctaUrl = content.ctaButtonUrl ? replaceVars(content.ctaButtonUrl) : "";
    html = `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
<div style="max-width:600px;margin:0 auto;padding:20px;background:#ffffff;">
<div style="font-size:16px;line-height:1.6;color:#333;white-space:pre-wrap;">${bodyText}</div>
${ctaLabel && ctaUrl ? `<div style="text-align:center;margin:30px 0;"><a href="${ctaUrl}" style="background:#0066A1;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">${ctaLabel}</a></div>` : ""}
</div></body></html>`;
    text = `${bodyText}\n\n${ctaLabel && ctaUrl ? `${ctaLabel}: ${ctaUrl}\n\n` : ""}`;
  }
  return { subject, html, text };
}

function buildVarsFromLead(lead: any, settings: any): Record<string, any> {
  return {
    nome: `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Gentile cliente",
    cognome: lead.lastName || "",
    telefono: lead.phone || "",
    email: lead.email || "",
    landing: lead.landingName || "",
    funnel: lead.funnelName || "",
    livello: lead.funnelLevel || "",
    studio: settings?.studioName || "Studio",
    studio_telefono: settings?.studioPhone || "",
    studio_email: settings?.studioEmail || "",
    studio_indirizzo: settings?.studioAddress || "",
    studio_orari: settings?.studioOpeningHours || "",
    booking_url: settings?.dashboardBaseUrl ? `${settings.dashboardBaseUrl}/prenota` : "",
  };
}

function applyAudienceFilters(leads: any[], filters: any, includedIds: string[] = [], excludedIds: string[] = []): any[] {
  let filtered = leads.filter((lead: any) => {
    if (excludedIds.includes(lead.id)) return false;
    if (includedIds.includes(lead.id)) return true;
    if (filters?.marketingConsentRequired && !lead.marketingConsent) return false;
    if (filters?.excludeUnsubscribed && (lead.tags || []).includes("unsubscribed")) return false;
    if (filters?.landingIds?.length && !filters.landingIds.includes(lead.landingId)) return false;
    if (filters?.funnelIds?.length && !filters.funnelIds.includes(lead.funnelId)) return false;
    if (filters?.funnelLevels?.length && !filters.funnelLevels.includes(lead.funnelLevel)) return false;
    if (filters?.statuses?.length && !filters.statuses.includes(lead.status)) return false;
    if (filters?.tags?.length) {
      const leadTags = lead.tags || [];
      if (!filters.tags.some((t: string) => leadTags.includes(t))) return false;
    }
    return true;
  });
  // Aggiungi quelli inclusi manualmente che non erano filtrati
  const explicit = leads.filter(l =>
    includedIds.includes(l.id) && !filtered.find((f: any) => f.id === l.id)
  );
  return [...filtered, ...explicit];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { broadcastId } = req.body || {};
    if (!broadcastId) return res.status(400).json({ error: "broadcastId required" });

    const fs = getFirebaseAdmin();

    // Carica broadcast + settings
    const [bcDoc, settingsSnap] = await Promise.all([
      fs.collection("broadcastCampaigns").doc(broadcastId).get(),
      fs.collection("appSettings").doc("global").get(),
    ]);

    if (!bcDoc.exists) {
      return res.status(404).json({ error: "Broadcast non trovato" });
    }

    const broadcast: any = { id: bcDoc.id, ...bcDoc.data() };
    const settings = settingsSnap.exists ? (settingsSnap.data() as any) : {};

    if (broadcast.status === "sent" || broadcast.status === "sending") {
      return res.status(400).json({ error: `Broadcast in stato ${broadcast.status}` });
    }

    const apiKey = settings.resendApiKey || process.env.RESEND_API_KEY;
    const fromAddress = settings.emailFromAddress || process.env.RESEND_FROM_EMAIL;
    const fromName = settings.emailFromName || "Studio";

    if (!apiKey || !fromAddress) {
      return res.status(400).json({ error: "Email provider non configurato" });
    }

    // Aggiorna stato a sending
    await bcDoc.ref.update({ status: "sending", updatedAt: new Date().toISOString() });

    // Carica tutti i lead
    const leadsSnap = await fs.collection("leads").get();
    const allLeads: any[] = leadsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Applica filtri audience
    const recipients = applyAudienceFilters(
      allLeads,
      broadcast.audienceFilters || {},
      broadcast.manuallyIncludedLeadIds || [],
      broadcast.manuallyExcludedLeadIds || []
    ).filter((l: any) => l.email && l.email.includes("@"));

    // Carica template se referenziato
    let content: any = {
      subject: broadcast.subject,
      bodyText: broadcast.bodyText,
      bodyHtml: broadcast.bodyHtml,
      editorMode: broadcast.editorMode,
      ctaButtonLabel: broadcast.ctaButtonLabel,
      ctaButtonUrl: broadcast.ctaButtonUrl,
    };
    if (broadcast.templateId) {
      const tplDoc = await fs.collection("emailTemplatesV2").doc(broadcast.templateId).get();
      if (tplDoc.exists) {
        const tpl: any = tplDoc.data();
        content = { ...content, ...tpl };
        // Override col custom subject/body se presenti
        if (broadcast.subject) content.subject = broadcast.subject;
        if (broadcast.bodyText) content.bodyText = broadcast.bodyText;
        if (broadcast.bodyHtml) content.bodyHtml = broadcast.bodyHtml;
      }
    }

    const resend = new Resend(apiKey);
    const fromHeader = fromName ? `${fromName} <${fromAddress}>` : fromAddress;

    let sent = 0;
    let failed = 0;
    const startTs = new Date().toISOString();

    for (const lead of recipients) {
      try {
        const vars = buildVarsFromLead(lead, settings);
        const { subject, html, text } = renderTemplate(content, vars);

        const result: any = await resend.emails.send({
          from: fromHeader,
          to: lead.email,
          subject,
          html,
          text,
        } as any);

        const messageId = result?.data?.id || result?.id;
        const error = result?.error;

        if (error) {
          failed++;
          await fs.collection("emailEvents").add({
            leadId: lead.id,
            emailType: "broadcast",
            broadcastId: broadcast.id,
            templateId: broadcast.templateId || null,
            eventType: "bounced",
            eventData: { error: JSON.stringify(error) },
            occurredAt: new Date().toISOString(),
          });
        } else {
          sent++;
          await fs.collection("emailEvents").add({
            leadId: lead.id,
            emailType: "broadcast",
            broadcastId: broadcast.id,
            templateId: broadcast.templateId || null,
            providerMessageId: messageId || null,
            eventType: "sent",
            occurredAt: new Date().toISOString(),
          });
        }
      } catch (e: any) {
        failed++;
        console.error("Error sending to lead", lead.id, e?.message);
      }
    }

    // Aggiorna broadcast
    await bcDoc.ref.update({
      status: "sent",
      sentAt: startTs,
      actualRecipients: recipients.length,
      totalSent: sent,
      totalFailed: failed,
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      ok: true,
      totalSent: sent,
      totalFailed: failed,
      recipients: recipients.length,
    });
  } catch (error: any) {
    console.error("Send broadcast error:", error);
    return res.status(500).json({ error: error?.message || "Internal error" });
  }
}
