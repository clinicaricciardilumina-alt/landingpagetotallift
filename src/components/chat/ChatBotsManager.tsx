import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Power, MessageCircle, Eye } from "lucide-react";
import * as chatService from "../../lib/chatService";
import * as funnelService from "../../lib/funnelService";
import { CAMPAIGN_CATEGORIES } from "../../types";
import type { ChatBot, LandingPageDoc, ContactForm, Funnel, ChatToneOfVoice } from "../../types";
import ChatConversationsViewer from "./ChatConversationsViewer";

const TONE_OPTIONS: { value: ChatToneOfVoice; label: string; description: string }[] = [
  { value: "professionale", label: "Professionale", description: "Formale, competente, autorevole" },
  { value: "amichevole", label: "Amichevole", description: "Vicino al paziente, caldo" },
  { value: "rassicurante", label: "Rassicurante", description: "Calmo, empatico per ansiosi" },
  { value: "empatico", label: "Empatico", description: "Mette al primo posto i sentimenti" },
  { value: "diretto", label: "Diretto", description: "Va al punto, senza fronzoli" },
];

export default function ChatBotsManager() {
  const [bots, setBots] = useState<ChatBot[]>([]);
  const [editing, setEditing] = useState<ChatBot | null>(null);
  const [viewingConversations, setViewingConversations] = useState<ChatBot | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    setBots(await chatService.getChatBots());
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const create = async () => {
    const bot = await chatService.addChatBot({
      internalName: "Nuova Chat",
      enabled: false,
      botName: "Sofia",
      initialMessage: "Ciao! Sono qui per aiutarti. Come posso esserti utile?",
      welcomeQuickReplies: ["Voglio info su un trattamento", "Voglio prenotare una visita", "Ho un'urgenza"],
      toneOfVoice: "rassicurante",
      delaySeconds: 5,
      autoOpen: false,
      showOnMobile: true,
      position: "bottom-right",
      ctaBookingEnabled: true,
      ctaBookingLabel: "Prenota una visita",
      ctaFormEnabled: true,
      ctaFormLabel: "Lascia i tuoi dati",
      showOnLandingIds: [],
      showOnAllLandings: false,
      saveConversations: true,
      autoTagging: true,
      leadScoring: true,
      notifyOnLead: true,
      maxMessagesPerSession: 30,
      maxTokensPerResponse: 400,
      primaryColor: "#0066A1",
    });
    refresh();
    setEditing(bot);
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminare questa chat? Le conversazioni salvate restano nel database.")) return;
    await chatService.deleteChatBot(id);
    refresh();
  };

  const toggleEnabled = async (b: ChatBot) => {
    await chatService.updateChatBot(b.id, { enabled: !b.enabled });
    refresh();
  };

  if (viewingConversations) {
    return <ChatConversationsViewer bot={viewingConversations} onClose={() => setViewingConversations(null)} />;
  }

  if (editing) {
    return <ChatBotEditor bot={editing} onClose={() => { setEditing(null); refresh(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Chat AI</h2>
          <p className="text-gray-500 text-sm">Assistenti virtuali per le tue landing page</p>
        </div>
        <button onClick={create} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2">
          <Plus size={18} /> Nuova Chat
        </button>
      </div>

      {loading ? (
        <p>Caricamento...</p>
      ) : bots.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="text-xl font-black text-gray-900 mb-2">Nessuna chat ancora</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Crea la prima chat AI: conversa con i visitatori, classifica i lead in base all'urgenza, e li indirizza verso prenotazione o modulo.
          </p>
          <button onClick={create} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">
            + Crea la prima chat
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {bots.map((b) => (
            <div key={b.id} className="bg-white p-5 rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-300 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg"
                    style={{ backgroundColor: b.primaryColor || "#0066A1" }}
                  >
                    {b.botName?.[0]?.toUpperCase() || "🤖"}
                  </div>
                  <div>
                    <h3 className="font-black">{b.internalName}</h3>
                    <p className="text-xs text-gray-500">Bot: {b.botName} · {TONE_OPTIONS.find(t => t.value === b.toneOfVoice)?.label}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleEnabled(b)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                    b.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {b.enabled ? "Attiva" : "Disattiva"}
                </button>
              </div>

              <div className="text-xs text-gray-600 mb-3 line-clamp-2">
                "{b.initialMessage}"
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {b.serviceContext && (
                  <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold">
                    {b.serviceContext}
                  </span>
                )}
                {b.showOnAllLandings && (
                  <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 rounded font-bold">
                    Tutte le landing
                  </span>
                )}
                {!b.showOnAllLandings && b.showOnLandingIds.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 rounded font-bold">
                    {b.showOnLandingIds.length} landing
                  </span>
                )}
                {b.notifyOnLead && (
                  <span className="text-[10px] px-2 py-0.5 bg-orange-50 text-orange-700 rounded font-bold">
                    Notifica lead
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setEditing(b)} className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-100">
                  <Edit2 size={12} /> Modifica
                </button>
                <button onClick={() => setViewingConversations(b)} className="px-3 py-1.5 border-2 rounded-lg text-xs font-bold flex items-center gap-1">
                  <Eye size={12} /> Conversazioni
                </button>
                <button onClick={() => remove(b.id)} className="px-3 py-1.5 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// EDITOR
// =====================================================
function ChatBotEditor({ bot, onClose }: { bot: ChatBot; onClose: () => void }) {
  const [data, setData] = useState<ChatBot>(bot);
  const [landings, setLandings] = useState<LandingPageDoc[]>([]);
  const [forms, setForms] = useState<ContactForm[]>([]);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [savedMsg, setSavedMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"basic" | "behavior" | "appearance" | "cta" | "visibility" | "advanced">("basic");

  useEffect(() => {
    (async () => {
      setLandings(await funnelService.getLandings());
      setForms(await funnelService.getContactForms());
      setFunnels(await funnelService.getFunnels());
    })();
  }, []);

  const save = async () => {
    await chatService.updateChatBot(bot.id, data);
    setSavedMsg("✓ Salvato");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const update = (patch: Partial<ChatBot>) => setData(prev => ({ ...prev, ...patch }));

  const tabs = [
    { id: "basic", label: "Base" },
    { id: "behavior", label: "Comportamento" },
    { id: "appearance", label: "Aspetto" },
    { id: "cta", label: "CTA" },
    { id: "visibility", label: "Visibilità" },
    { id: "advanced", label: "Avanzate" },
  ] as const;

  const addFAQ = () => update({ faqs: [...(data.faqs || []), { q: "", a: "" }] });
  const updateFAQ = (i: number, patch: any) => update({ faqs: (data.faqs || []).map((f, idx) => idx === i ? { ...f, ...patch } : f) });
  const removeFAQ = (i: number) => update({ faqs: (data.faqs || []).filter((_, idx) => idx !== i) });

  const updateQR = (i: number, val: string) => {
    const arr = [...(data.welcomeQuickReplies || [])];
    arr[i] = val;
    update({ welcomeQuickReplies: arr });
  };
  const addQR = () => update({ welcomeQuickReplies: [...(data.welcomeQuickReplies || []), ""] });
  const removeQR = (i: number) => update({ welcomeQuickReplies: (data.welcomeQuickReplies || []).filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-0 bg-gray-50 z-10 py-2">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="px-4 py-2 border-2 rounded-xl font-bold">← Indietro</button>
          <h2 className="text-2xl font-black">Modifica Chat: {data.internalName}</h2>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-green-600 font-bold">{savedMsg}</span>}
          <button onClick={save} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold">Salva</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-1 inline-flex flex-wrap gap-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === t.id ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: BASE */}
      {activeTab === "basic" && (
        <Card title="Informazioni base">
          <Field label="Nome interno" hint="Solo per te, identifica la chat nella dashboard">
            <input type="text" value={data.internalName} onChange={e => update({ internalName: e.target.value })} className="input" />
          </Field>
          <Field label="Nome del chatbot" hint="Visibile al visitatore">
            <input type="text" value={data.botName} onChange={e => update({ botName: e.target.value })} className="input" placeholder="Es: Sofia, Marco, Ricciardi Bot" />
          </Field>
          <Field label="Avatar URL (opzionale)">
            <input type="url" value={data.avatarUrl || ""} onChange={e => update({ avatarUrl: e.target.value })} className="input" placeholder="https://..." />
          </Field>
          <Field label="Servizio/Trattamento" hint="Su cosa è specializzato il bot">
            <select value={data.serviceContext || ""} onChange={e => update({ serviceContext: e.target.value || undefined })} className="input">
              <option value="">— Generico —</option>
              {CAMPAIGN_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Descrizione del servizio" hint="Aiuta il bot a rispondere. Sarà incluso nel prompt.">
            <textarea value={data.serviceDescription || ""} onChange={e => update({ serviceDescription: e.target.value })} className="input" rows={3} />
          </Field>
          <Field label="Funnel collegato">
            <select value={data.funnelId || ""} onChange={e => update({ funnelId: e.target.value || undefined })} className="input">
              <option value="">— Nessuno —</option>
              {funnels.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </Field>
        </Card>
      )}

      {/* TAB: COMPORTAMENTO */}
      {activeTab === "behavior" && (
        <>
          <Card title="Messaggio iniziale e tono">
            <Field label="Messaggio iniziale" hint="Il primo messaggio che vede il visitatore">
              <textarea value={data.initialMessage} onChange={e => update({ initialMessage: e.target.value })} className="input" rows={3} />
            </Field>
            <Field label="Tono di voce">
              <div className="grid grid-cols-2 gap-2">
                {TONE_OPTIONS.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => update({ toneOfVoice: t.value })}
                    className={`p-3 rounded-xl border-2 text-left ${data.toneOfVoice === t.value ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  >
                    <div className="font-bold text-sm">{t.label}</div>
                    <div className="text-[11px] text-gray-500">{t.description}</div>
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Risposte rapide iniziali" hint="Bottoni che aiutano l'utente a iniziare">
              <div className="space-y-2">
                {(data.welcomeQuickReplies || []).map((qr, i) => (
                  <div key={i} className="flex gap-1">
                    <input type="text" value={qr} onChange={e => updateQR(i, e.target.value)} className="input flex-1" />
                    <button onClick={() => removeQR(i)} className="px-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                ))}
                <button onClick={addQR} className="w-full py-2 border-2 border-dashed rounded-lg text-xs font-bold text-gray-600 hover:border-blue-400">
                  + Aggiungi risposta rapida
                </button>
              </div>
            </Field>
          </Card>

          <Card title="FAQ del bot" hint="Domande e risposte che il bot sa già">
            <div className="space-y-3">
              {(data.faqs || []).map((faq, i) => (
                <div key={i} className="border-2 rounded-xl p-3 space-y-2 bg-gray-50">
                  <input type="text" value={faq.q} onChange={e => updateFAQ(i, { q: e.target.value })} className="input" placeholder="Domanda..." />
                  <textarea value={faq.a} onChange={e => updateFAQ(i, { a: e.target.value })} className="input" rows={2} placeholder="Risposta..." />
                  <button onClick={() => removeFAQ(i)} className="text-xs text-red-600 hover:underline">
                    Elimina FAQ
                  </button>
                </div>
              ))}
              <button onClick={addFAQ} className="w-full py-2 border-2 border-dashed rounded-lg text-xs font-bold hover:border-blue-400">
                + Aggiungi FAQ
              </button>
            </div>
          </Card>

          <Card title="Apertura automatica">
            <Field label="Apri automaticamente la chat?">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={data.autoOpen} onChange={e => update({ autoOpen: e.target.checked })} />
                <span className="text-sm">Sì, apri da sola</span>
              </label>
            </Field>
            <Field label="Ritardo apertura (secondi)" hint="Tempo prima che la chat appaia">
              <input type="number" min={0} value={data.delaySeconds} onChange={e => update({ delaySeconds: parseInt(e.target.value) || 0 })} className="input" />
            </Field>
          </Card>

          <Card title="Prompt avanzato (opzionale)">
            <Field label="System prompt custom" hint="Sovrascrivi il prompt automatico. Solo per esperti.">
              <textarea value={data.systemPromptCustom || ""} onChange={e => update({ systemPromptCustom: e.target.value })} className="input font-mono text-xs" rows={6} placeholder="Lascia vuoto per usare il prompt automatico generato dal sistema" />
            </Field>
          </Card>
        </>
      )}

      {/* TAB: ASPETTO */}
      {activeTab === "appearance" && (
        <Card title="Aspetto">
          <Field label="Colore primario">
            <input type="color" value={data.primaryColor || "#0066A1"} onChange={e => update({ primaryColor: e.target.value })} className="w-full h-12 rounded-xl border-2" />
          </Field>
          <Field label="Posizione">
            <select value={data.position} onChange={e => update({ position: e.target.value as any })} className="input">
              <option value="bottom-right">In basso a destra</option>
              <option value="bottom-left">In basso a sinistra</option>
            </select>
          </Field>
          <Field label="Mostra su mobile">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={data.showOnMobile} onChange={e => update({ showOnMobile: e.target.checked })} />
              <span className="text-sm">Sì, mostra anche su smartphone</span>
            </label>
          </Field>
        </Card>
      )}

      {/* TAB: CTA */}
      {activeTab === "cta" && (
        <Card title="Call To Action della chat">
          <p className="text-xs text-gray-500 mb-4">Il bot proporrà queste azioni in modo intelligente quando l'utente è pronto.</p>
          <div className="border-2 rounded-xl p-4 mb-3 bg-gray-50">
            <label className="flex items-center gap-2 mb-3">
              <input type="checkbox" checked={data.ctaBookingEnabled} onChange={e => update({ ctaBookingEnabled: e.target.checked })} />
              <span className="font-bold text-sm">CTA "Prenota visita"</span>
            </label>
            {data.ctaBookingEnabled && (
              <>
                <Field label="Testo bottone">
                  <input type="text" value={data.ctaBookingLabel} onChange={e => update({ ctaBookingLabel: e.target.value })} className="input" />
                </Field>
                <Field label="URL prenotazione (opzionale)" hint="Se vuoto, usa il modulo di prenotazione interno della landing">
                  <input type="url" value={data.ctaBookingUrl || ""} onChange={e => update({ ctaBookingUrl: e.target.value })} className="input" placeholder="https://..." />
                </Field>
              </>
            )}
          </div>

          <div className="border-2 rounded-xl p-4 bg-gray-50">
            <label className="flex items-center gap-2 mb-3">
              <input type="checkbox" checked={data.ctaFormEnabled} onChange={e => update({ ctaFormEnabled: e.target.checked })} />
              <span className="font-bold text-sm">CTA "Lascia i dati"</span>
            </label>
            {data.ctaFormEnabled && (
              <>
                <Field label="Testo bottone">
                  <input type="text" value={data.ctaFormLabel} onChange={e => update({ ctaFormLabel: e.target.value })} className="input" />
                </Field>
                <Field label="Modulo collegato (opzionale)">
                  <select value={data.ctaFormId || ""} onChange={e => update({ ctaFormId: e.target.value || undefined })} className="input">
                    <option value="">— Mini form integrato in chat —</option>
                    {forms.map(f => <option key={f.id} value={f.id}>{f.internalName}</option>)}
                  </select>
                </Field>
              </>
            )}
          </div>
        </Card>
      )}

      {/* TAB: VISIBILITÀ */}
      {activeTab === "visibility" && (
        <Card title="Dove mostrare la chat">
          <Field label="Mostra in tutte le landing">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={data.showOnAllLandings} onChange={e => update({ showOnAllLandings: e.target.checked })} />
              <span className="text-sm">Sì, mostra in tutte</span>
            </label>
          </Field>
          {!data.showOnAllLandings && (
            <Field label="Landing specifiche" hint="Seleziona dove vuoi che appaia">
              <div className="space-y-1 max-h-64 overflow-y-auto border-2 rounded-xl p-2">
                {landings.length === 0 ? (
                  <p className="text-xs text-gray-500 p-2">Nessuna landing creata. Vai su "Landing Pages".</p>
                ) : landings.map(l => (
                  <label key={l.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={data.showOnLandingIds.includes(l.id)}
                      onChange={e => {
                        const checked = e.target.checked;
                        const arr = checked
                          ? [...data.showOnLandingIds, l.id]
                          : data.showOnLandingIds.filter(id => id !== l.id);
                        update({ showOnLandingIds: arr });
                      }}
                    />
                    <span className="text-sm">{l.internalName}</span>
                  </label>
                ))}
              </div>
            </Field>
          )}
        </Card>
      )}

      {/* TAB: AVANZATE */}
      {activeTab === "advanced" && (
        <Card title="Funzioni avanzate">
          <Toggle label="Salva conversazioni" hint="Tutte le chat vengono archiviate per analisi" checked={data.saveConversations} onChange={v => update({ saveConversations: v })} />
          <Toggle label="Tag automatici" hint="Il bot assegna tag al lead in base al contenuto" checked={data.autoTagging} onChange={v => update({ autoTagging: v })} />
          <Toggle label="Lead scoring" hint="Classifica lead come freddo/tiepido/caldo/urgente" checked={data.leadScoring} onChange={v => update({ leadScoring: v })} />
          <Toggle label="Notifica via email quando arriva lead" checked={data.notifyOnLead} onChange={v => update({ notifyOnLead: v })} />

          <Field label="Limite messaggi per sessione" hint="Per controllare i costi API">
            <input type="number" min={5} max={100} value={data.maxMessagesPerSession} onChange={e => update({ maxMessagesPerSession: parseInt(e.target.value) || 30 })} className="input" />
          </Field>
          <Field label="Lunghezza max risposta (token)" hint="Più alto = risposte più lunghe e care">
            <input type="number" min={100} max={2000} value={data.maxTokensPerResponse} onChange={e => update({ maxTokensPerResponse: parseInt(e.target.value) || 400 })} className="input" />
          </Field>
        </Card>
      )}

      <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; border: 2px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.875rem; }`}</style>
    </div>
  );
}

// =====================================================
// Mini-componenti
// =====================================================
function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl space-y-3">
      <div>
        <h3 className="font-black">{title}</h3>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1">{label}</label>
      {hint && <p className="text-[11px] text-gray-500 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between p-3 border-2 rounded-xl bg-gray-50">
      <div>
        <div className="font-bold text-sm">{label}</div>
        {hint && <div className="text-[11px] text-gray-500">{hint}</div>}
      </div>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-5 h-5" />
    </div>
  );
}
