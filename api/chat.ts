/**
 * Vercel Serverless Function: /api/chat
 *
 * Supporta DUE provider AI selezionabili dalle impostazioni:
 * - Anthropic Claude (a pagamento, ~$5 minimo)
 * - Google Gemini (gratis con limiti generosi)
 *
 * Il provider si sceglie in Dashboard → Impostazioni → API Keys → "Provider AI"
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// =====================================================
// FIREBASE ADMIN
// =====================================================
function getFirebaseAdmin() {
  if (getApps().length === 0) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountJson) {
      try {
        initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
      } catch (e) {
        console.error("Service account JSON malformed", e);
        initializeApp();
      }
    } else {
      initializeApp();
    }
  }
  return getFirestore();
}

// =====================================================
// SYSTEM PROMPT BUILDER (uguale per entrambi i provider)
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

function extractMetaAndCleanResponse(rawText: string): {
  visibleText: string;
  meta: any;
} {
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
// PROVIDER: ANTHROPIC
// =====================================================
async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: any[],
  maxTokens: number
) {
  const cleanMessages: Anthropic.MessageParam[] = messages.map((m: any): Anthropic.MessageParam => ({
    role: m.role === "user" ? "user" : "assistant",
    content:
      m.role === "assistant"
        ? String(m.content).replace(/<META>[\s\S]*?<\/META>/g, "").trim()
        : String(m.content),
  })).filter((m) => typeof m.content === "string" && m.content.length > 0);

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: cleanMessages,
  });

  const rawText = response.content
    .filter((c: any) => c.type === "text")
    .map((c: any) => c.text)
    .join("\n");

  return {
    rawText,
    usage: {
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    },
  };
}

// =====================================================
// PROVIDER: GOOGLE GEMINI
// =====================================================
async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: any[],
  maxTokens: number
) {
  const ai = new GoogleGenAI({ apiKey });

  // Gemini accetta una "history" con role + parts.text
  const history = messages
    .slice(0, -1) // tutti tranne l'ultimo (che è l'attuale)
    .map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [
        {
          text:
            m.role === "assistant"
              ? String(m.content).replace(/<META>[\s\S]*?<\/META>/g, "").trim()
              : String(m.content),
        },
      ],
    }))
    .filter((m: any) => m.parts[0].text && m.parts[0].text.length > 0);

  // Last message is the current user question
  const lastMessage = messages[messages.length - 1];
  const currentMessage = String(lastMessage?.content || "");

  const chat = ai.chats.create({
    model: model || "gemini-2.5-flash",
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: maxTokens,
      temperature: 0.7,
    },
    history: history,
  });

  const response = await chat.sendMessage({ message: currentMessage });
  const rawText = response.text || "";

  return {
    rawText,
    usage: {
      inputTokens: response.usageMetadata?.promptTokenCount,
      outputTokens: response.usageMetadata?.candidatesTokenCount,
    },
  };
}

// =====================================================
// MAIN HANDLER
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

    // ----- Sistema prompt -----
    const systemPrompt = buildSystemPrompt(bot, settings);
    const maxTokens = bot.maxTokensPerResponse || 400;

    // ----- Limita messaggi -----
    const limitedMessages = messages.slice(
      -Math.max(bot.maxMessagesPerSession || 30, 10)
    );

    // ----- Scegli provider -----
    // Default: gemini (gratis). Si può scegliere "anthropic" nelle impostazioni.
    const provider = settings.aiProvider || "gemini";

    let result;
    if (provider === "anthropic") {
      const apiKey = settings.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "Anthropic API key not configured",
          reply: "Chat AI in modalità test. Configura la API key Anthropic nelle impostazioni, oppure usa Gemini (gratis).",
        });
      }
      const model = settings.anthropicModel || "claude-haiku-4-5-20251001";
      result = await callAnthropic(apiKey, model, systemPrompt, limitedMessages, maxTokens);
    } else {
      // Gemini di default
      const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "Gemini API key not configured",
          reply: "Configura la API key Gemini nelle impostazioni (gratis su Google AI Studio).",
        });
      }
      const model = settings.geminiModel || "gemini-2.5-flash";
      result = await callGemini(apiKey, model, systemPrompt, limitedMessages, maxTokens);
    }

    const { visibleText, meta } = extractMetaAndCleanResponse(result.rawText);

    return res.status(200).json({
      reply: visibleText,
      meta,
      usage: result.usage,
      provider,
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
