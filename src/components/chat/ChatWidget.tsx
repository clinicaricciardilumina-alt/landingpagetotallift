import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Calendar, FileText } from "lucide-react";
import { callChatApi } from "../../lib/apiClient";
import * as chatService from "../../lib/chatService";
import * as funnelService from "../../lib/funnelService";
import * as notificationService from "../../lib/notificationService";
import * as settingsService from "../../lib/settingsService";
import type { ChatBot, ChatMessage, ChatConversation, Lead } from "../../types";

interface Props {
  bot: ChatBot;
  landingId?: string;
  landingName?: string;
  onLeadCreated?: (leadId: string) => void;
  onBookingClick?: () => void;
  onFormClick?: () => void;
}

/**
 * Widget Chat AI inseribile nelle landing page.
 * Gestisce: apertura/chiusura, messaggi, classificazione lead,
 * raccolta dati, salvataggio conversazione, notifica interna.
 */
export default function ChatWidget({
  bot,
  landingId,
  landingName,
  onLeadCreated,
  onBookingClick,
  onFormClick,
}: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ firstName: "", phone: "", email: "" });
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [classification, setClassification] = useState<string | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [urgency, setUrgency] = useState(false);
  const [suggestedCta, setSuggestedCta] = useState<string | undefined>();
  const [askContact, setAskContact] = useState(false);
  const [submittedContact, setSubmittedContact] = useState(false);

  const sessionIdRef = useRef<string>(`sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ----- Apertura iniziale automatica con ritardo -----
  useEffect(() => {
    if (bot.autoOpen) {
      const t = setTimeout(() => setOpen(true), (bot.delaySeconds || 0) * 1000);
      return () => clearTimeout(t);
    }
  }, [bot.autoOpen, bot.delaySeconds]);

  // ----- Mostra messaggio iniziale all'apertura -----
  useEffect(() => {
    if (open && messages.length === 0 && bot.initialMessage) {
      setMessages([
        {
          role: "assistant",
          content: bot.initialMessage,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [open]);

  // ----- Auto scroll -----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking, askContact]);

  // ----- Crea/aggiorna conversazione su Firestore -----
  const persistConversation = async (newMessages: ChatMessage[], extra: Partial<ChatConversation> = {}) => {
    if (!bot.saveConversations) return null;

    if (!conversationId) {
      const conv = await chatService.addConversation({
        chatBotId: bot.id,
        chatBotName: bot.botName,
        landingId,
        landingName,
        messages: newMessages,
        detectedTags: tags,
        detectedUrgency: urgency,
        leadCreated: false,
        startedAt: new Date().toISOString(),
        sessionId: sessionIdRef.current,
        ...extra,
      });
      setConversationId(conv.id);
      return conv.id;
    } else {
      await chatService.updateConversation(conversationId, {
        messages: newMessages,
        detectedTags: tags,
        detectedUrgency: urgency,
        classification: classification as any,
        ...extra,
      });
      return conversationId;
    }
  };

  // ----- Invia messaggio -----
  const sendMessage = async (text: string) => {
    if (!text.trim() || thinking) return;
    setInput("");

    const userMsg: ChatMessage = { role: "user", content: text, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setThinking(true);

    try {
      const apiMessages = newMessages.map(m => ({
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      }));

      const result = await callChatApi(bot.id, apiMessages);

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: result.reply,
        timestamp: new Date().toISOString(),
      };
      const updated = [...newMessages, assistantMsg];
      setMessages(updated);

      // Aggiorna stato conversazione in base al meta
      if (result.meta) {
        if (result.meta.classification) setClassification(result.meta.classification);
        if (result.meta.tags?.length && bot.autoTagging) {
          setTags(prev => Array.from(new Set([...prev, ...(result.meta.tags || [])])));
        }
        if (result.meta.urgency) setUrgency(true);
        if (result.meta.suggested_cta && result.meta.suggested_cta !== "none") {
          setSuggestedCta(result.meta.suggested_cta);
        }
        if (result.meta.ask_contact_data) {
          setAskContact(true);
        }
      }

      await persistConversation(updated, {
        classification: result.meta?.classification as any,
        detectedService: result.meta?.detected_service,
      });

      // Se urgenza rilevata e bot ha notifyOnLead, manda comunque una notifica
      // immediata anche senza dati (apri "alert urgenza")
      if (result.meta?.urgency && bot.notifyOnLead && !submittedContact) {
        await sendUrgentNotification();
      }
    } catch (e) {
      console.error("Chat error:", e);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Mi dispiace, c'è stato un problema. Vuoi lasciare i tuoi contatti e ti richiameremo?",
          timestamp: new Date().toISOString(),
        },
      ]);
      setAskContact(true);
    }
    setThinking(false);
  };

  // ----- Invia notifica per urgenza rilevata -----
  const sendUrgentNotification = async () => {
    try {
      const rules = await notificationService.getNotificationRules();
      const matching = notificationService.findMatchingRules(rules, "lead_classified_urgent", {
        landingId,
        tags,
      });
      if (matching.length === 0) return;

      const settings = await settingsService.getAppSettings();

      for (const rule of matching) {
        const vars = {
          nome: "Visitatore non identificato",
          telefono: "—",
          email: "—",
          landing: landingName || "",
          tag: tags.join(", "),
          riepilogo_chat_o_risposte: messages
            .map(m => `${m.role === "user" ? "Utente" : "Bot"}: ${m.content}`)
            .join("\n"),
          azione_consigliata: "URGENZA RILEVATA - Verificare conversazione, possibile contatto immediato",
          link_dashboard: settings.dashboardBaseUrl
            ? `${settings.dashboardBaseUrl}/dashboard`
            : "(non configurato)",
        };

        const subject = notificationService.renderTemplate(rule.emailSubject, vars);
        const body = notificationService.renderTemplate(rule.emailBody, vars);

        const { callSendEmailApi } = await import("../../lib/apiClient");
        await callSendEmailApi({
          to: rule.primaryRecipient,
          cc: rule.ccRecipients,
          bcc: rule.bccRecipients,
          subject,
          html: rule.emailFormat === "html" ? body.replace(/\n/g, "<br>") : undefined,
          text: rule.emailFormat === "text" ? body : undefined,
          ruleId: rule.id,
          ruleName: rule.name,
          trigger: "lead_classified_urgent",
          landingId,
          conversationId: conversationId || undefined,
        });
      }
    } catch (e) {
      console.error("Errore notifica urgenza:", e);
    }
  };

  // ----- Invia dati contatto → crea Lead -----
  const submitContactData = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!contactForm.firstName || (!contactForm.phone && !contactForm.email)) return;

    try {
      // Crea lead
      const lead: Omit<Lead, "id"> = {
        firstName: contactForm.firstName,
        phone: contactForm.phone || undefined,
        email: contactForm.email || undefined,
        landingId,
        landingName,
        funnelId: bot.funnelId,
        answers: {},
        formData: { source: "chat_ai", chatBotId: bot.id },
        tags: tags,
        funnelLevel:
          urgency || classification === "urgente"
            ? "urgenza"
            : classification === "caldo"
            ? "lead_caldo"
            : classification === "tiepido"
            ? "lead_tiepido"
            : "lead_freddo",
        status: "nuovo",
        emailsSent: [],
        notificationsSent: [],
        actionLog: [
          {
            id: `log_${Date.now()}`,
            type: "lead_from_chat",
            description: `Lead generato da chat AI (${bot.botName})`,
            timestamp: new Date().toISOString(),
            metadata: { chatBotId: bot.id, conversationId },
          },
        ],
        privacyConsent: true,
        marketingConsent: false,
        acquiredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const createdLead = await funnelService.addLead(lead);

      // Aggiorna conversazione con leadId
      if (conversationId) {
        await chatService.updateConversation(conversationId, {
          leadCreated: true,
          leadId: createdLead.id,
          visitorFirstName: contactForm.firstName,
          visitorPhone: contactForm.phone,
          visitorEmail: contactForm.email,
        });
      }

      setSubmittedContact(true);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `Grazie ${contactForm.firstName}! Ti richiameremo a breve. Nel frattempo, vuoi prenotare direttamente uno slot?`,
          timestamp: new Date().toISOString(),
        },
      ]);
      setAskContact(false);

      onLeadCreated?.(createdLead.id);

      // Notifica
      if (bot.notifyOnLead) {
        const rules = await notificationService.getNotificationRules();
        const matching = notificationService.findMatchingRules(rules, "chat_data_left", {
          landingId,
          funnelId: bot.funnelId,
          tags,
        });
        const settings = await settingsService.getAppSettings();

        for (const rule of matching) {
          const vars = notificationService.buildVarsFromLead(
            { ...lead, id: createdLead.id } as Lead,
            {
              serviceContext: bot.serviceContext,
              chatSummary: messages
                .map(m => `${m.role === "user" ? "Utente" : "Bot"}: ${m.content}`)
                .join("\n"),
              suggestedAction: urgency
                ? "URGENTE — contattare al più presto"
                : "Contattare entro 24h",
              dashboardUrl: settings.dashboardBaseUrl,
            }
          );
          const subject = notificationService.renderTemplate(rule.emailSubject, vars);
          const body = notificationService.renderTemplate(rule.emailBody, vars);
          const { callSendEmailApi } = await import("../../lib/apiClient");
          await callSendEmailApi({
            to: rule.primaryRecipient,
            cc: rule.ccRecipients,
            bcc: rule.bccRecipients,
            subject,
            html: rule.emailFormat === "html" ? body.replace(/\n/g, "<br>") : undefined,
            text: rule.emailFormat === "text" ? body : undefined,
            ruleId: rule.id,
            ruleName: rule.name,
            trigger: "chat_data_left",
            leadId: createdLead.id,
            landingId,
            funnelId: bot.funnelId,
            conversationId: conversationId || undefined,
          });
        }
      }
    } catch (e) {
      console.error("Errore creazione lead:", e);
      alert("Si è verificato un errore. Riprova.");
    }
  };

  const handleBookingClick = async () => {
    if (conversationId) {
      await chatService.updateConversation(conversationId, { ctaClicked: "booking" });
    }
    onBookingClick?.();
    if (bot.ctaBookingUrl) window.open(bot.ctaBookingUrl, "_blank");
  };

  const handleFormClick = async () => {
    if (conversationId) {
      await chatService.updateConversation(conversationId, { ctaClicked: "form" });
    }
    setAskContact(true);
    onFormClick?.();
  };

  const primary = bot.primaryColor || "#0066A1";

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <>
      {/* Bottone fluttuante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed z-50 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform"
          style={{
            backgroundColor: primary,
            width: 60,
            height: 60,
            [bot.position === "bottom-left" ? "left" : "right"]: 20,
            bottom: 20,
          }}
          aria-label="Apri chat"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Pannello chat */}
      {open && (
        <div
          className="fixed z-50 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{
            [bot.position === "bottom-left" ? "left" : "right"]: 20,
            bottom: 20,
            width: "min(380px, calc(100vw - 40px))",
            height: "min(600px, calc(100vh - 40px))",
          }}
        >
          {/* Header */}
          <div className="p-4 text-white" style={{ backgroundColor: primary }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl font-black"
                >
                  {bot.avatarUrl ? (
                    <img src={bot.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    bot.botName?.[0]?.toUpperCase() || "🤖"
                  )}
                </div>
                <div>
                  <div className="font-black">{bot.botName}</div>
                  <div className="text-xs opacity-80">In linea</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg"
                aria-label="Chiudi"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messaggi */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "text-white rounded-br-sm"
                      : "bg-white text-gray-900 rounded-bl-sm shadow-sm"
                  }`}
                  style={m.role === "user" ? { backgroundColor: primary } : {}}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-500 rounded-2xl rounded-bl-sm px-3 py-2 text-sm shadow-sm">
                  <span className="inline-block animate-pulse">●●●</span>
                </div>
              </div>
            )}

            {/* Quick Replies iniziali (solo se ci sono e è il primo messaggio) */}
            {messages.length === 1 && bot.welcomeQuickReplies && bot.welcomeQuickReplies.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {bot.welcomeQuickReplies.map((qr, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(qr)}
                    className="text-xs border-2 rounded-full px-3 py-1.5 hover:bg-blue-50"
                    style={{ borderColor: primary, color: primary }}
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}

            {/* CTA suggerite */}
            {!thinking && !submittedContact && suggestedCta === "booking" && bot.ctaBookingEnabled && (
              <button
                onClick={handleBookingClick}
                className="w-full p-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90"
                style={{ backgroundColor: primary }}
              >
                <Calendar size={16} /> {bot.ctaBookingLabel || "Prenota una visita"}
              </button>
            )}

            {!thinking && !submittedContact && suggestedCta === "form" && bot.ctaFormEnabled && !askContact && (
              <button
                onClick={handleFormClick}
                className="w-full p-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2"
                style={{ borderColor: primary, color: primary }}
              >
                <FileText size={16} /> {bot.ctaFormLabel || "Lascia i tuoi dati"}
              </button>
            )}

            {/* Mini form contatto */}
            {askContact && !submittedContact && (
              <form onSubmit={submitContactData} className="bg-white p-4 rounded-xl border-2 space-y-2 shadow-sm">
                <div className="font-bold text-sm mb-2 text-gray-900">Lascia i tuoi dati</div>
                <input
                  type="text"
                  required
                  placeholder="Nome*"
                  value={contactForm.firstName}
                  onChange={e => setContactForm({ ...contactForm, firstName: e.target.value })}
                  className="w-full p-2 border-2 rounded-lg text-sm"
                />
                <input
                  type="tel"
                  placeholder="Telefono"
                  value={contactForm.phone}
                  onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                  className="w-full p-2 border-2 rounded-lg text-sm"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={contactForm.email}
                  onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full p-2 border-2 rounded-lg text-sm"
                />
                <button
                  type="submit"
                  className="w-full p-2 rounded-lg text-white font-bold text-sm"
                  style={{ backgroundColor: primary }}
                >
                  Invia
                </button>
                <p className="text-[10px] text-gray-500">
                  Inviando accetti la privacy policy. Nome + (telefono o email) richiesti.
                </p>
              </form>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="p-3 border-t bg-white flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Scrivi un messaggio..."
              className="flex-1 p-2 border-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              disabled={thinking}
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              className="px-3 rounded-lg text-white disabled:opacity-50"
              style={{ backgroundColor: primary }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
