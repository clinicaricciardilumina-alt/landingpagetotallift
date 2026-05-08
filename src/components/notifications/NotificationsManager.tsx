import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Mail, Eye, Send } from "lucide-react";
import * as notificationService from "../../lib/notificationService";
import * as funnelService from "../../lib/funnelService";
import { FUNNEL_LEVELS, CAMPAIGN_CATEGORIES } from "../../types";
import type { NotificationRule, NotificationLog, NotificationTriggerType, LandingPageDoc, Funnel } from "../../types";

const TRIGGER_OPTIONS: { value: NotificationTriggerType; label: string; description?: string }[] = [
  { value: "lead_created", label: "Nuova lead creata", description: "Qualunque lead in arrivo" },
  { value: "form_submitted", label: "Modulo compilato", description: "Lead da modulo contatto" },
  { value: "chat_completed", label: "Chat completata", description: "Conversazione AI conclusa" },
  { value: "chat_data_left", label: "Dati lasciati in chat", description: "Lead da chat AI" },
  { value: "booking_made", label: "Prenotazione fatta", description: "Slot prenotato" },
  { value: "lead_classified_hot", label: "Lead classificato CALDO" },
  { value: "lead_classified_urgent", label: "Lead classificato URGENTE", description: "Massima priorità" },
  { value: "info_request", label: "Richiesta info" },
  { value: "no_booking_data_left", label: "Dati lasciati senza prenotare" },
];

const DEFAULT_TEMPLATES = {
  default: {
    subject: "Nuova lead da {{landing}}",
    body: `È arrivata una nuova lead.

Nome: {{nome}}
Telefono: {{telefono}}
Email: {{email}}

Landing: {{landing}}
Funnel: {{funnel}}
Servizio: {{servizio}}
Livello Funnel: {{livello_funnel}}
Tag: {{tag}}

Riepilogo:
{{riepilogo_chat_o_risposte}}

Azione consigliata:
{{azione_consigliata}}

Apri lead: {{link_dashboard}}`,
  },
  urgent: {
    subject: "🚨 URGENZA - Lead da {{landing}}",
    body: `⚠️ URGENZA RILEVATA

Nome: {{nome}}
Telefono: {{telefono}}

Servizio: {{servizio}}
Tag: {{tag}}

Riepilogo conversazione:
{{riepilogo_chat_o_risposte}}

🔥 CONTATTARE IL PRIMA POSSIBILE 🔥

Link: {{link_dashboard}}`,
  },
};

export default function NotificationsManager() {
  const [activeView, setActiveView] = useState<"rules" | "logs">("rules");
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [editing, setEditing] = useState<NotificationRule | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const [r, l] = await Promise.all([
      notificationService.getNotificationRules(),
      notificationService.getNotificationLogs(),
    ]);
    setRules(r);
    setLogs(l);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const create = async (template: keyof typeof DEFAULT_TEMPLATES = "default") => {
    const tpl = DEFAULT_TEMPLATES[template];
    const rule = await notificationService.addNotificationRule({
      name: "Nuova regola notifica",
      enabled: true,
      trigger: template === "urgent" ? "lead_classified_urgent" : "lead_created",
      primaryRecipient: "",
      emailSubject: tpl.subject,
      emailBody: tpl.body,
      emailFormat: "text",
    });
    refresh();
    setEditing(rule);
  };

  if (editing) {
    return <RuleEditor rule={editing} onClose={() => { setEditing(null); refresh(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Notifiche Interne</h2>
          <p className="text-gray-500 text-sm">Email automatiche al team quando arrivano lead</p>
        </div>
        {activeView === "rules" && (
          <div className="flex gap-2">
            <button onClick={() => create("urgent")} className="px-4 py-2 border-2 rounded-xl font-bold text-sm">
              + Regola urgenza
            </button>
            <button onClick={() => create("default")} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2">
              <Plus size={18} /> Nuova Regola
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-1 inline-flex gap-1">
        <button onClick={() => setActiveView("rules")} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeView === "rules" ? "bg-blue-600 text-white" : ""}`}>
          Regole ({rules.length})
        </button>
        <button onClick={() => setActiveView("logs")} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeView === "logs" ? "bg-blue-600 text-white" : ""}`}>
          Storico inviate ({logs.length})
        </button>
      </div>

      {loading ? (
        <p>Caricamento...</p>
      ) : activeView === "rules" ? (
        rules.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed">
            <Mail size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-xl font-black mb-2">Nessuna regola</h3>
            <p className="text-gray-500 mb-6">Crea regole per ricevere email quando arrivano lead</p>
            <button onClick={() => create("default")} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold">
              + Crea prima regola
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map(r => (
              <div key={r.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black truncate">{r.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${r.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {r.enabled ? "ATTIVA" : "DISATTIVA"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    Trigger: <strong>{TRIGGER_OPTIONS.find(t => t.value === r.trigger)?.label}</strong>
                    {r.primaryRecipient && ` → ${r.primaryRecipient}`}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setEditing(r)} className="p-2 rounded-lg hover:bg-gray-100"><Edit2 size={16} /></button>
                  <button onClick={async () => {
                    if (confirm("Eliminare regola?")) {
                      await notificationService.deleteNotificationRule(r.id);
                      refresh();
                    }
                  }} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed">
              <p className="text-gray-500">Nessuna notifica inviata ancora</p>
            </div>
          ) : logs.map(l => (
            <div key={l.id} className="bg-white p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="font-bold text-sm truncate flex-1">{l.subject}</div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ml-2 ${
                  l.status === "sent" ? "bg-green-100 text-green-700" :
                  l.status === "stub" ? "bg-yellow-100 text-yellow-700" :
                  l.status === "failed" ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {l.status === "stub" ? "STUB (no API key)" : l.status.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-gray-500 mb-2">
                A: {l.recipients.join(", ")} · {new Date(l.sentAt).toLocaleString("it-IT")}
              </div>
              <div className="text-xs text-gray-600 line-clamp-2">{l.bodyPreview}</div>
              {l.errorMessage && <div className="text-xs text-red-600 mt-1">⚠ {l.errorMessage}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// RULE EDITOR
// =====================================================
function RuleEditor({ rule, onClose }: { rule: NotificationRule; onClose: () => void }) {
  const [data, setData] = useState<NotificationRule>(rule);
  const [landings, setLandings] = useState<LandingPageDoc[]>([]);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [savedMsg, setSavedMsg] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    (async () => {
      setLandings(await funnelService.getLandings());
      setFunnels(await funnelService.getFunnels());
    })();
  }, []);

  const update = (patch: Partial<NotificationRule>) => setData(prev => ({ ...prev, ...patch }));

  const save = async () => {
    await notificationService.updateNotificationRule(rule.id, data);
    setSavedMsg("✓ Salvato");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const sampleVars = {
    nome: "Maria Rossi",
    telefono: "333 1234567",
    email: "maria@esempio.it",
    landing: "Implantologia Maggio",
    funnel: "Funnel Implantologia",
    servizio: "implantologia",
    livello_funnel: "lead_caldo",
    tag: "interessata, prezzi",
    riepilogo_chat_o_risposte: "Maria ha chiesto info sull'implantologia, ha mostrato interesse per i tempi.",
    azione_consigliata: "Contattare entro 24h per fissare visita",
    link_dashboard: "https://miapp.com/dashboard?leadId=ABC123",
    data: new Date().toLocaleString("it-IT"),
  };

  const previewSubject = notificationService.renderTemplate(data.emailSubject, sampleVars);
  const previewBody = notificationService.renderTemplate(data.emailBody, sampleVars);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-0 bg-gray-50 z-10 py-2">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="px-4 py-2 border-2 rounded-xl font-bold">← Indietro</button>
          <h2 className="text-2xl font-black">Regola: {data.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && <span className="text-green-600 font-bold text-sm">{savedMsg}</span>}
          <button onClick={() => setShowPreview(!showPreview)} className="px-4 py-2 border-2 rounded-xl font-bold flex items-center gap-1">
            <Eye size={14} /> Anteprima
          </button>
          <button onClick={save} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold">Salva</button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card title="Configurazione base">
            <Field label="Nome regola">
              <input type="text" value={data.name} onChange={e => update({ name: e.target.value })} className="input" />
            </Field>
            <Field label="Stato">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={data.enabled} onChange={e => update({ enabled: e.target.checked })} />
                <span className="text-sm font-bold">Regola attiva</span>
              </label>
            </Field>
            <Field label="Trigger" hint="Quando inviare la notifica">
              <select value={data.trigger} onChange={e => update({ trigger: e.target.value as NotificationTriggerType })} className="input">
                {TRIGGER_OPTIONS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}{t.description ? ` — ${t.description}` : ""}</option>
                ))}
              </select>
            </Field>
          </Card>

          <Card title="Filtri (opzionali)" hint="Lascia vuoto per applicare a tutti">
            <Field label="Solo per landing">
              <select value={data.filterLandingId || ""} onChange={e => update({ filterLandingId: e.target.value || undefined })} className="input">
                <option value="">Tutte le landing</option>
                {landings.map(l => <option key={l.id} value={l.id}>{l.internalName}</option>)}
              </select>
            </Field>
            <Field label="Solo per funnel">
              <select value={data.filterFunnelId || ""} onChange={e => update({ filterFunnelId: e.target.value || undefined })} className="input">
                <option value="">Tutti i funnel</option>
                {funnels.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </Field>
            <Field label="Solo per servizio">
              <select value={data.filterService || ""} onChange={e => update({ filterService: e.target.value || undefined })} className="input">
                <option value="">Tutti i servizi</option>
                {CAMPAIGN_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Solo per livello">
              <select value={data.filterFunnelLevel || ""} onChange={e => update({ filterFunnelLevel: (e.target.value || undefined) as any })} className="input">
                <option value="">Tutti i livelli</option>
                {FUNNEL_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </Field>
          </Card>

          <Card title="Destinatari">
            <Field label="Email principale" hint="Destinatario obbligatorio">
              <input type="email" value={data.primaryRecipient} onChange={e => update({ primaryRecipient: e.target.value })} className="input" placeholder="studio@esempio.it" />
            </Field>
            <Field label="CC (separati da virgola)">
              <input type="text" value={(data.ccRecipients || []).join(", ")} onChange={e => update({ ccRecipients: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} className="input" />
            </Field>
            <Field label="BCC (separati da virgola)">
              <input type="text" value={(data.bccRecipients || []).join(", ")} onChange={e => update({ bccRecipients: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} className="input" />
            </Field>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Template email">
            <Field label="Oggetto" hint="Usa {{nome}}, {{landing}}, {{servizio}}, ecc.">
              <input type="text" value={data.emailSubject} onChange={e => update({ emailSubject: e.target.value })} className="input" />
            </Field>
            <Field label="Formato">
              <select value={data.emailFormat} onChange={e => update({ emailFormat: e.target.value as any })} className="input">
                <option value="text">Solo testo</option>
                <option value="html">HTML</option>
              </select>
            </Field>
            <Field label="Corpo" hint="Variabili disponibili sotto">
              <textarea value={data.emailBody} onChange={e => update({ emailBody: e.target.value })} className="input font-mono text-xs" rows={14} />
            </Field>
            <div className="bg-blue-50 p-3 rounded-xl text-xs">
              <div className="font-bold mb-1">Variabili disponibili:</div>
              <div className="font-mono text-[10px] grid grid-cols-2 gap-x-2 gap-y-0.5">
                {Object.keys(sampleVars).map(k => <div key={k}>{`{{${k}}}`}</div>)}
              </div>
            </div>
          </Card>

          {showPreview && (
            <Card title="Anteprima con dati di esempio">
              <div className="border-2 rounded-xl p-3 bg-gray-50">
                <div className="text-[10px] font-bold uppercase text-gray-500 mb-1">Oggetto</div>
                <div className="font-bold mb-3">{previewSubject}</div>
                <div className="text-[10px] font-bold uppercase text-gray-500 mb-1">Corpo</div>
                <div className="text-xs whitespace-pre-wrap">{previewBody}</div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; border: 2px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.875rem; }`}</style>
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white p-5 rounded-2xl space-y-3">
      <div>
        <h3 className="font-black text-sm">{title}</h3>
        {hint && <p className="text-[11px] text-gray-500">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1">{label}</label>
      {hint && <p className="text-[10px] text-gray-500 mb-1">{hint}</p>}
      {children}
    </div>
  );
}
