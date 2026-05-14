/**
 * Vercel Serverless Cron: /api/run-scheduled
 *
 * Cron che gira ogni N minuti per:
 * 1. Trovare gli enrollments attivi con nextScheduledAt <= now
 * 2. Inviare l'email del prossimo step
 * 3. Aggiornare lo stato dell'enrollment
 *
 * Si chiama via cron Vercel (vedi vercel.json) ogni 5 minuti.
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

// =====================================================
// TEMPLATE RENDERER (semplificato lato server)
// =====================================================
function renderTemplate(tpl: any, vars: Record<string, any>) {
  const replaceVars = (text: string): string =>
    text.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_m, k) => {
      const v = vars[k];
      if (v === undefined || v === null) return "";
      return String(v);
    });

  const subject = replaceVars(tpl.subject || "");
  let html: string;
  let text: string;

  if (tpl.editorMode === "html" && tpl.bodyHtml) {
    html = replaceVars(tpl.bodyHtml);
    text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  } else {
    const bodyText = replaceVars(tpl.bodyText || "");
    const ctaLabel = tpl.ctaButtonLabel ? replaceVars(tpl.ctaButtonLabel) : "";
    const ctaUrl = tpl.ctaButtonUrl ? replaceVars(tpl.ctaButtonUrl) : "";
    const footer = tpl.footerText ? replaceVars(tpl.footerText) : "";
    html = `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
<div style="max-width:600px;margin:0 auto;padding:20px;background:#ffffff;">
<div style="font-size:16px;line-height:1.6;color:#333;white-space:pre-wrap;">${bodyText}</div>
${ctaLabel && ctaUrl ? `<div style="text-align:center;margin:30px 0;"><a href="${ctaUrl}" style="background:#0066A1;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">${ctaLabel}</a></div>` : ""}
${footer ? `<div style="font-size:12px;color:#888;border-top:1px solid #eee;padding-top:20px;margin-top:30px;">${footer}</div>` : ""}
</div></body></html>`;
    text = `${bodyText}\n\n${ctaLabel && ctaUrl ? `${ctaLabel}: ${ctaUrl}\n\n` : ""}${footer}`;
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
    dashboard_url: settings?.dashboardBaseUrl
      ? `${settings.dashboardBaseUrl}/admin?leadId=${lead.id}`
      : "",
    booking_url: settings?.dashboardBaseUrl ? `${settings.dashboardBaseUrl}/prenota` : "",
  };
}

// =====================================================
// HANDLER
// =====================================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo POST/GET (cron Vercel usa GET)
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Sicurezza: valida cron secret se configurato
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.authorization || "";
    if (auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    const fs = getFirebaseAdmin();
    const settingsSnap = await fs.collection("appSettings").doc("global").get();
    const settings = settingsSnap.exists ? (settingsSnap.data() as any) : {};

    const apiKey = settings.resendApiKey || process.env.RESEND_API_KEY;
    const fromAddress = settings.emailFromAddress || process.env.RESEND_FROM_EMAIL;
    const fromName = settings.emailFromName || "Studio";

    if (!apiKey || !fromAddress) {
      return res.status(200).json({ ok: true, skipped: "Email non configurate" });
    }

    const resend = new Resend(apiKey);
    const fromHeader = fromName ? `${fromName} <${fromAddress}>` : fromAddress;

    const now = new Date();
    const nowIso = now.toISOString();

    // Trova enrollments attivi con scheduledAt <= now
    const enrollSnap = await fs.collection("automationEnrollments")
      .where("status", "==", "active")
      .where("nextScheduledAt", "<=", nowIso)
      .limit(50)
      .get();

    let processed = 0;
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const enrollDoc of enrollSnap.docs) {
      processed++;
      const enrollment: any = { id: enrollDoc.id, ...enrollDoc.data() };

      try {
        // Carica automation
        const autoDoc = await fs.collection("emailAutomations").doc(enrollment.automationId).get();
        if (!autoDoc.exists) {
          await enrollDoc.ref.update({ status: "failed", exitReason: "Automation non trovata", exitedAt: nowIso });
          continue;
        }
        const automation: any = autoDoc.data();

        if (!automation.enabled) {
          await enrollDoc.ref.update({ status: "exited", exitReason: "Automation disabilitata", exitedAt: nowIso });
          continue;
        }

        // Carica lead
        const leadDoc = await fs.collection("leads").doc(enrollment.leadId).get();
        if (!leadDoc.exists) {
          await enrollDoc.ref.update({ status: "failed", exitReason: "Lead non trovato", exitedAt: nowIso });
          continue;
        }
        const lead: any = { id: leadDoc.id, ...leadDoc.data() };

        // Determina prossimo step
        const sortedSteps = [...(automation.steps || [])].sort((a: any, b: any) => a.order - b.order);
        const nextStepOrder = enrollment.currentStepOrder + 1;
        const step = sortedSteps[nextStepOrder];

        if (!step) {
          // Sequenza completata
          await enrollDoc.ref.update({
            status: "completed",
            completedAt: nowIso,
            nextScheduledAt: null,
          });
          continue;
        }

        // Check skip conditions
        let shouldSkip = false;
        let skipReason = "";

        if (step.skipIfBookingMade && (lead.tags || []).some((t: string) => ["prenotato", "booking_fatto"].includes(t))) {
          shouldSkip = true;
          skipReason = "Lead ha già prenotato";
        } else if (step.skipIfTagPresent?.length) {
          const has = step.skipIfTagPresent.some((t: string) => (lead.tags || []).includes(t));
          if (has) {
            shouldSkip = true;
            skipReason = "Lead ha tag che esclude lo step";
          }
        } else if (step.skipIfLevelIs?.length) {
          if (step.skipIfLevelIs.includes(lead.funnelLevel)) {
            shouldSkip = true;
            skipReason = "Lead già a livello superiore";
          }
        }

        if (!shouldSkip && !lead.email) {
          shouldSkip = true;
          skipReason = "Lead senza email";
        }

        // Calcola prossimo step (per scheduling)
        const nextStep = sortedSteps[nextStepOrder + 1];
        let nextScheduledAt: string | null = null;
        if (nextStep) {
          const next = new Date(now);
          if (nextStep.delayType === "minutes") next.setMinutes(next.getMinutes() + nextStep.delayValue);
          else if (nextStep.delayType === "hours") next.setHours(next.getHours() + nextStep.delayValue);
          else if (nextStep.delayType === "days") next.setDate(next.getDate() + nextStep.delayValue);
          nextScheduledAt = next.toISOString();
        }

        const stepsCompleted = enrollment.stepsCompleted || [];

        if (shouldSkip) {
          stepsCompleted.push({ stepId: step.id, sentAt: nowIso, skipped: true, skipReason });
          skipped++;
        } else {
          // Carica template
          const tplDoc = await fs.collection("emailTemplatesV2").doc(step.templateId).get();
          if (!tplDoc.exists) {
            stepsCompleted.push({ stepId: step.id, sentAt: nowIso, skipped: true, skipReason: "Template non trovato" });
            skipped++;
          } else {
            const tpl: any = tplDoc.data();
            const vars = buildVarsFromLead(lead, settings);
            const { subject, html, text } = renderTemplate(tpl, vars);

            // Invia
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
              stepsCompleted.push({ stepId: step.id, sentAt: nowIso, skipped: true, skipReason: `Invio fallito: ${JSON.stringify(error)}` });
            } else {
              sent++;
              stepsCompleted.push({ stepId: step.id, sentAt: nowIso });

              // Log evento
              await fs.collection("emailEvents").add({
                leadId: lead.id,
                emailType: "automation",
                automationId: automation.id,
                enrollmentId: enrollment.id,
                templateId: step.templateId,
                providerMessageId: messageId || null,
                eventType: "sent",
                occurredAt: nowIso,
              });

              // Applica tag/level se richiesto
              if (step.addTagsAfterSend?.length) {
                const newTags = Array.from(new Set([...(lead.tags || []), ...step.addTagsAfterSend]));
                await leadDoc.ref.update({ tags: newTags, updatedAt: nowIso });
              }
              if (step.changeLevelAfterSend) {
                await leadDoc.ref.update({ funnelLevel: step.changeLevelAfterSend, updatedAt: nowIso });
              }
            }
          }
        }

        // Aggiorna enrollment
        await enrollDoc.ref.update({
          currentStepOrder: nextStepOrder,
          stepsCompleted,
          nextScheduledAt,
          ...(nextScheduledAt ? {} : { status: "completed", completedAt: nowIso }),
        });
      } catch (err: any) {
        failed++;
        console.error("Error processing enrollment", enrollment.id, err);
      }
    }

    return res.status(200).json({
      ok: true,
      processed,
      sent,
      skipped,
      failed,
      timestamp: nowIso,
    });
  } catch (error: any) {
    console.error("Cron error:", error);
    return res.status(500).json({ error: error?.message || "Internal error" });
  }
}
