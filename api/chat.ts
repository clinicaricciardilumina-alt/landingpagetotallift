/**
 * Vercel Serverless Function: /api/chat
 *
 * Riceve una richiesta dal client (browser) con:
 * - messaggi della conversazione
 * - botId (per recuperare configurazione chat)
 *
 * Esegue lato server:
 * 1. Recupera la API key Anthropic da Firestore (mai esposta al client)
 * 2. Costruisce il system prompt dinamico in base al chatbot
 * 3. Chiama Claude Haiku
 * 4. Analizza la risposta per: tag automatici, classificazione lead, urgenza
 * 5. Restituisce al client il messaggio + metadata strutturata
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// =====================================================
// FIREBASE ADMIN INITIALIZATION
// =====================================================
function getFirebaseAdmin() {
  if (getApps().length === 0) {
    // In Vercel: imposta FIREBASE_SERVICE_ACCOUNT_KEY come JSON serializzato
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountJson) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        initializeApp({ credential: cert(serviceAccount) });
      } catch (e) {
        console.error("Service account JSON malformed", e);
        // fallback: applicazione default credentials (utile in alcune piattaforme)
        initializeApp();
      }
    } else {
      initializeApp();
    }
  }
  return getFirestore();
}

// =====================================================
// SYSTEM PROMPT BUILDER
// =====================================================
function buildSystemPrompt(bot: any, settings: any): string {
  const studioName = settings?.studioName || "lo studio dentistico";
  const studioAddress = settings?.studioAddress || "";
  const studioPhone = settings?.studioPhone || "";
  const studioHours = settings?.studioOpeningHours || "";

  const tone = bot?.toneOfVoice || "professionale";
  const botName = bot?.botName || "Assistente";
  const service = bot?.serviceContext || "";
  const serviceDescription = bot?.serviceDescription || "";

  const faqs = (bot?.faqs || []) as { q: string; a: string }[];
  const faqsText = faqs.length
    ? `\n\nDOMANDE FREQUENTI (usa queste come riferimento):\n${faqs
        .map((f, i) => `Q${i + 1}: ${f.q}\nA${i + 1}: ${f.a}`)
        .join("\n\n")}`
    : "";

  const ctaBlock = [
    bot?.ctaBookingEnabled
      ? `- Quando opportuno, proponi: "${bot.ctaBookingLabel || "Prenota una visita"}" (CTA_BOOKING)`
      : "",
    bot?.ctaFormEnabled
      ? `- Quando opportuno, proponi: "${bot.ctaFormLabel || "Lascia i tuoi dati"}" (CTA_FORM)`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const customPrompt = bot?.systemPromptCustom?.trim();

  if (customPrompt) {
    // L'utente ha definito un prompt custom completo, lo usiamo come base
    return `${customPrompt}

---
CONTESTO STUDIO:
${studioName}${studioAddress ? `, ${studioAddress}` : ""}
${studioPhone ? `Telefono: ${studioPhone}` : ""}
${studioHours ? `Orari: ${studioHours}` : ""}${faqsText}

CTA DISPONIBILI:
${ctaBlock || "(nessuna CTA configurata)"}

REGOLE OBBLIGATORIE:
1. NON dare diagnosi mediche
2. NON promettere risultati specifici
3. NON sostituire il dentista
4. Rispondi in italiano
5. Rimani concentrato sui servizi dello studio

ALLA FINE DI OGNI RISPOSTA, su una NUOVA RIGA, scrivi un blocco JSON così:
<META>{"classification": "freddo|tiepido|caldo|urgente", "tags": ["tag1","tag2"], "urgency": false, "suggested_cta": "booking|form|none", "ask_contact_data": false}</META>`;
  }

  // Prompt costruito dinamicamente
  return `Sei "${botName}", un assistente virtuale di ${studioName}.

RUOLO E TONO:
Il tuo compito è accogliere i visitatori del sito, rispondere a domande sui servizi e indirizzare verso una visita dentistica o richiesta di informazioni.
Tono di voce: ${tone}.
${service ? `Sei specializzato sul servizio: ${service}.` : ""}
${serviceDescription ? `\nDESCRIZIONE SERVIZIO:\n${serviceDescription}` : ""}

CONTESTO STUDIO:
${studioName}${studioAddress ? `, ${studioAddress}` : ""}
${studioPhone ? `Telefono: ${studioPhone}` : ""}
${studioHours ? `Orari: ${studioHours}` : ""}${faqsText}

OBIETTIVO PRIMARIO:
Convertire il visitatore in lead. In modo naturale, NON forzato, guidalo verso:
1. Lasciare nome, telefono ed email
2. Prenotare una visita di controllo
3. Richiedere informazioni più specifiche

CTA DISPONIBILI (proponile quando opportuno, mai forzando):
${ctaBlock || "(nessuna CTA configurata)"}

REGOLE OBBLIGATORIE:
1. NON dare diagnosi mediche o cliniche
2. NON promettere risultati specifici (es. "guarisce sicuramente")
3. NON sostituire il dentista, sempre rimandare a visita
4. NON fornire prezzi definitivi (sempre "dipende dalla situazione, valutabile in visita")
5. Rispondi SEMPRE in italiano
6. Rimani sui servizi dello studio, non parlare di altri argomenti
7. Risposte BREVI e chiare (massimo 2-3 frasi quando possibile)
8. Se utente parla di dolore acuto, traumi, gonfiore: classifica come URGENTE e proponi contatto immediato

RACCOGLI INTERESSE:
- Capisci il bisogno del visitatore
- Identifica se è freddo (curioso), tiepido (informandosi), caldo (intenzione di visita), urgente (problema acuto)
- Quando l'utente sembra interessato, proponi una CTA

ALLA FINE DI OGNI TUA RISPOSTA, su una nuova riga, aggiungi un blocco di metadati strutturato così (è importantissimo, lo userà il sistema):
<META>{"classification":"freddo|tiepido|caldo|urgente","tags":["tag1","tag2"],"urgency":true|false,"suggested_cta":"booking|form|none","ask_contact_data":true|false,"detected_service":"opzionale"}</META>

Esempi di classification:
- "freddo": utente chiede info generiche
- "tiepido": utente confronta opzioni, ha interesse
- "caldo": utente vuole prenotare o pronto a contatto
- "urgente": utente ha dolore, trauma, sintomi acuti

Esempi di tags da usare (sempre minuscolo, con underscore):
- nome del servizio (es. "implantologia", "ortodonzia")
- intenzione (es. "interessato_prezzi", "vuole_prenotare", "informazioni_generiche")
- urgenza (es. "dolore_acuto", "trauma", "estetica")

NON inserire MAI il blocco <META> all'interno della risposta visibile, solo alla FINE.`;
}

// =====================================================
// META EXTRACTION
// =====================================================
function extractMetaAndCleanResponse(rawText: string): {
  visibleText: string;
  meta: {
    classification?: string;
    tags?: string[];
    urgency?: boolean;
    suggested_cta?: string;
    ask_contact_data?: boolean;
    detected_service?: string;
  };
} {
  // cerca blocco <META>...</META>
  const metaMatch = rawText.match(/<META>([\s\S]*?)<\/META>/);
  let meta = {};
  let visibleText = rawText;

  if (metaMatch) {
    visibleText = rawText.replace(metaMatch[0], "").trim();
    try {
      meta = JSON.parse(metaMatch[1].trim());
    } catch (e) {
      console.warn("Meta JSON parse failed:", metaMatch[1]);
    }
  }

  return { visibleText, meta };
}

// =====================================================
// HANDLER
// =====================================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { botId, messages } = req.body || {};

    if (!botId || !Array.isArray(messages)) {
      return res.status(400).json({ error: "botId and messages required" });
    }

    // ----- 1. Recupera bot + settings -----
    const fs = getFirebaseAdmin();
    const [botSnap, settingsSnap] = await Promise.all([
      fs.collection("chatBots").doc(botId).get(),
      fs.collection("appSettings").doc("global").get(),
    ]);

    if (!botSnap.exists) {
      return res.status(404).json({ error: "Bot not found" });
    }
    const bot = botSnap.data() as any;
    const settings = settingsSnap.exists ? (settingsSnap.data() as any) : {};

    if (!bot.enabled) {
      return res.status(403).json({ error: "Bot disabled" });
    }

    // ----- 2. API key -----
    const apiKey = settings.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Anthropic API key not configured",
        stub: true,
        reply: "Chat AI in modalità test. Configura la API key nelle impostazioni.",
      });
    }

    // ----- 3. Costruisci system prompt -----
    const systemPrompt = buildSystemPrompt(bot, settings);
    const model = settings.anthropicModel || "claude-haiku-4-5-20251001";

    // ----- 4. Limita messaggi e stripa il META dai messaggi precedenti dell'assistente -----
    const cleanMessages: Anthropic.MessageParam[] = messages
      .slice(-Math.max(bot.maxMessagesPerSession || 30, 10))
      .map((m: any): Anthropic.MessageParam => ({
        role: m.role === "user" ? "user" : "assistant",
        content:
          m.role === "assistant"
            ? String(m.content).replace(/<META>[\s\S]*?<\/META>/g, "").trim()
            : String(m.content),
      }))
      .filter((m: Anthropic.MessageParam) => typeof m.content === "string" && m.content.length > 0);

    // ----- 5. Chiama Claude -----
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: bot.maxTokensPerResponse || 400,
      system: systemPrompt,
      messages: cleanMessages,
    });

    // ----- 6. Estrai risposta + meta -----
    const rawText = response.content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("\n");

    const { visibleText, meta } = extractMetaAndCleanResponse(rawText);

    return res.status(200).json({
      reply: visibleText,
      meta,
      usage: {
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return res.status(500).json({
      error: error?.message || "Internal server error",
      reply:
        "Mi dispiace, c'è stato un problema tecnico. Vuoi lasciare i tuoi contatti e ti richiameremo?",
    });
  }
}
