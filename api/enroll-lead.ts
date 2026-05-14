/**
 * Vercel Serverless Function: /api/enroll-lead
 *
 * Quando arriva un evento (lead_created, form_submitted, ecc.) e vogliamo
 * iscrivere il lead nelle automation che combaciano, il client chiama
 * questo endpoint che:
 * 1. Trova le automation che corrispondono al trigger + filtri
 * 2. Crea gli enrollments (se non già presenti)
 *
 * NOTA: il client può anche fare questo lato browser, ma lo facciamo
 * lato server per consistenza e per non esporre query Firestore al client.
 *
 * Richiesta:
 *   POST /api/enroll-lead { leadId, trigger, triggerTag? }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
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

function matchesAutomation(automation: any, lead: any, trigger: string, triggerTag?: string): boolean {
  if (!automation.enabled) return false;
  if (automation.trigger !== trigger) return false;
  if (trigger === "tag_added" && automation.triggerTagFilter && automation.triggerTagFilter !== triggerTag) return false;

  if (automation.filterFunnelId && automation.filterFunnelId !== lead.funnelId) return false;
  if (automation.filterLandingId && automation.filterLandingId !== lead.landingId) return false;
  if (automation.filterFunnelLevel && automation.filterFunnelLevel !== lead.funnelLevel) return false;

  if (automation.filterTags?.length) {
    const leadTags = lead.tags || [];
    if (!automation.filterTags.some((t: string) => leadTags.includes(t))) return false;
  }
  return true;
}

function computeFirstScheduledTime(firstStep: any): Date {
  const now = new Date();
  if (firstStep.delayType === "immediate") return now;
  if (firstStep.delayType === "minutes") {
    const d = new Date(now); d.setMinutes(d.getMinutes() + firstStep.delayValue); return d;
  }
  if (firstStep.delayType === "hours") {
    const d = new Date(now); d.setHours(d.getHours() + firstStep.delayValue); return d;
  }
  if (firstStep.delayType === "days") {
    const d = new Date(now); d.setDate(d.getDate() + firstStep.delayValue); return d;
  }
  return now;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { leadId, trigger, triggerTag } = req.body || {};
    if (!leadId || !trigger) {
      return res.status(400).json({ error: "leadId e trigger required" });
    }

    const fs = getFirebaseAdmin();

    // Carica lead
    const leadDoc = await fs.collection("leads").doc(leadId).get();
    if (!leadDoc.exists) {
      return res.status(404).json({ error: "Lead non trovato" });
    }
    const lead: any = { id: leadDoc.id, ...leadDoc.data() };

    // Carica tutte le automation
    const autoSnap = await fs.collection("emailAutomations").get();
    const automations: any[] = autoSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Filtra quelle che combaciano
    const matching = automations.filter(a => matchesAutomation(a, lead, trigger, triggerTag));

    if (matching.length === 0) {
      return res.status(200).json({ ok: true, enrolled: 0 });
    }

    // Trova enrollments esistenti per evitare duplicati
    const existingSnap = await fs.collection("automationEnrollments")
      .where("leadId", "==", leadId)
      .get();
    const existingAutoIds = existingSnap.docs.map(d => d.data().automationId);

    let enrolled = 0;
    const nowIso = new Date().toISOString();

    for (const automation of matching) {
      // Già iscritto?
      if (existingAutoIds.includes(automation.id)) continue;
      // Senza step?
      if (!automation.steps?.length) continue;

      const sortedSteps = [...automation.steps].sort((a: any, b: any) => a.order - b.order);
      const firstStep = sortedSteps[0];
      const nextScheduled = computeFirstScheduledTime(firstStep);

      await fs.collection("automationEnrollments").add({
        automationId: automation.id,
        leadId: lead.id,
        status: "active",
        currentStepOrder: -1,
        nextScheduledAt: nextScheduled.toISOString(),
        stepsCompleted: [],
        enrolledAt: nowIso,
      });
      enrolled++;
    }

    return res.status(200).json({ ok: true, enrolled, matchedAutomations: matching.length });
  } catch (error: any) {
    console.error("Enroll lead error:", error);
    return res.status(500).json({ error: error?.message || "Internal error" });
  }
}
