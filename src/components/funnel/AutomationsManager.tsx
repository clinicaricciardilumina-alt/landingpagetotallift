import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import * as funnelService from "../../lib/funnelService";
import { FUNNEL_LEVELS } from "../../types";
import type { Automation, AutomationAction, AutomationActionType, AutomationTriggerType } from "../../types";

const TRIGGER_TYPES: { value: AutomationTriggerType; label: string }[] = [
  { value: "lead_created", label: "Lead creato" },
  { value: "form_submitted", label: "Modulo inviato" },
  { value: "answer_given", label: "Risposta data" },
  { value: "booking_made", label: "Appuntamento prenotato" },
  { value: "level_changed", label: "Cambio livello funnel" },
  { value: "tag_assigned", label: "Tag assegnato" },
];

const ACTION_TYPES: { value: AutomationActionType; label: string }[] = [
  { value: "send_email", label: "Invia email automatica" },
  { value: "show_thank_you", label: "Mostra Thank You" },
  { value: "redirect_to_booking", label: "Redirect a prenotazione" },
  { value: "assign_tag", label: "Assegna tag" },
  { value: "assign_level", label: "Assegna livello" },
  { value: "send_internal_email", label: "Email interna" },
  { value: "send_whatsapp", label: "Invia WhatsApp (struttura)" },
  { value: "save_lead", label: "Salva lead nel database" },
  { value: "webhook", label: "Webhook esterno" },
];

export default function AutomationsManager() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [editing, setEditing] = useState<Automation | null>(null);

  const refresh = async () => setAutomations(await funnelService.getAutomations());
  useEffect(() => { refresh(); }, []);

  const create = async () => {
    const created = await funnelService.addAutomation({
      name: "Nuova Automazione",
      trigger: "lead_created",
      actions: [],
      enabled: false,
      createdAt: new Date().toISOString(),
    });
    refresh();
    setEditing(created);
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminare questa automazione?")) return;
    await funnelService.deleteAutomation(id);
    refresh();
  };

  const toggle = async (a: Automation) => {
    await funnelService.updateAutomation(a.id, { enabled: !a.enabled });
    refresh();
  };

  if (editing) {
    return <AutomationEditor automation={editing} onClose={() => { setEditing(null); refresh(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Automazioni</h2>
          <p className="text-gray-500 text-sm">Reazioni automatiche basate su trigger</p>
        </div>
        <button onClick={create} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2">
          <Plus size={18} /> Nuova Automazione
        </button>
      </div>

      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4">
        <p className="text-sm text-yellow-900">
          <strong>Nota:</strong> Le automazioni di tipo <code>send_email</code>, <code>send_whatsapp</code> e <code>webhook</code> richiedono l'integrazione con servizi esterni (es. SendGrid, Twilio, Cloud Functions). 
          Qui puoi configurare la struttura, ma l'invio effettivo va abilitato a livello backend.
        </p>
      </div>

      <div className="grid gap-3">
        {automations.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed">
            <p className="text-gray-500">Nessuna automazione configurata.</p>
          </div>
        ) : automations.map(a => (
          <div key={a.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold">{a.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-bold ${a.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {a.enabled ? "Attiva" : "Disattivata"}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Trigger: {TRIGGER_TYPES.find(t => t.value === a.trigger)?.label} · {a.actions.length} azioni
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggle(a)} className="px-3 py-2 border-2 rounded-lg text-sm font-bold">
                {a.enabled ? "Disattiva" : "Attiva"}
              </button>
              <button onClick={() => setEditing(a)} className="p-2 rounded-lg hover:bg-gray-100"><Edit2 size={18} /></button>
              <button onClick={() => remove(a.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AutomationEditor({ automation, onClose }: { automation: Automation; onClose: () => void }) {
  const [data, setData] = useState<Automation>(automation);
  const [savedMsg, setSavedMsg] = useState("");

  const save = async () => {
    await funnelService.updateAutomation(automation.id, data);
    setSavedMsg("Salvato!");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const addAction = () => {
    const newAction: AutomationAction = {
      id: `act_${Date.now()}`,
      type: "send_email",
      config: {},
    };
    setData({ ...data, actions: [...data.actions, newAction] });
  };

  const updateAction = (id: string, updates: Partial<AutomationAction>) => {
    setData({ ...data, actions: data.actions.map(a => a.id === id ? { ...a, ...updates } : a) });
  };

  const removeAction = (id: string) => {
    setData({ ...data, actions: data.actions.filter(a => a.id !== id) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="px-4 py-2 border-2 rounded-xl font-bold">← Indietro</button>
          <h2 className="text-2xl font-black">Modifica Automazione</h2>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-green-600 font-bold">{savedMsg}</span>}
          <button onClick={save} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold">Salva</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl space-y-4">
        <input type="text" value={data.name} onChange={e => setData({...data, name: e.target.value})} className="w-full p-3 border-2 rounded-xl font-bold text-lg" placeholder="Nome automazione" />
        <textarea value={data.description || ""} onChange={e => setData({...data, description: e.target.value})} className="w-full p-3 border-2 rounded-xl" placeholder="Descrizione" rows={2} />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={data.enabled} onChange={e => setData({...data, enabled: e.target.checked})} />
          <span className="text-sm font-bold">Automazione attiva</span>
        </label>
      </div>

      <div className="bg-white p-6 rounded-2xl">
        <h3 className="font-black text-lg mb-4">Trigger</h3>
        <select value={data.trigger} onChange={e => setData({...data, trigger: e.target.value as AutomationTriggerType})} className="w-full p-3 border-2 rounded-xl">
          {TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="bg-white p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-lg">Azioni da eseguire</h3>
          <button onClick={addAction} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold text-sm flex items-center gap-1">
            <Plus size={14} /> Aggiungi azione
          </button>
        </div>
        <div className="space-y-3">
          {data.actions.length === 0 && (
            <p className="text-gray-400 italic text-sm">Nessuna azione configurata. Aggiungine almeno una.</p>
          )}
          {data.actions.map((action, idx) => (
            <div key={action.id} className="border-2 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-400">#{idx + 1}</span>
                <select value={action.type} onChange={e => updateAction(action.id, { type: e.target.value as AutomationActionType, config: {} })} className="flex-1 p-2 border-2 rounded-lg">
                  {ACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <input
                  type="number"
                  value={action.delaySeconds || 0}
                  onChange={e => updateAction(action.id, { delaySeconds: parseInt(e.target.value) || 0 })}
                  className="w-24 p-2 border-2 rounded-lg"
                  placeholder="Delay s"
                />
                <button onClick={() => removeAction(action.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
              </div>

              {/* Config specifica per tipo azione */}
              {action.type === "send_email" && (
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Subject" value={action.config.subject || ""} onChange={e => updateAction(action.id, { config: { ...action.config, subject: e.target.value } })} className="p-2 border-2 rounded-lg text-sm" />
                  <input type="text" placeholder="Template ID" value={action.config.templateId || ""} onChange={e => updateAction(action.id, { config: { ...action.config, templateId: e.target.value } })} className="p-2 border-2 rounded-lg text-sm" />
                </div>
              )}

              {action.type === "send_internal_email" && (
                <input type="email" placeholder="email@studio.it" value={action.config.email || ""} onChange={e => updateAction(action.id, { config: { ...action.config, email: e.target.value } })} className="w-full p-2 border-2 rounded-lg text-sm" />
              )}

              {action.type === "send_whatsapp" && (
                <input type="text" placeholder="Messaggio WhatsApp" value={action.config.message || ""} onChange={e => updateAction(action.id, { config: { ...action.config, message: e.target.value } })} className="w-full p-2 border-2 rounded-lg text-sm" />
              )}

              {action.type === "assign_tag" && (
                <input type="text" placeholder="Tag" value={action.config.tag || ""} onChange={e => updateAction(action.id, { config: { ...action.config, tag: e.target.value } })} className="w-full p-2 border-2 rounded-lg text-sm" />
              )}

              {action.type === "assign_level" && (
                <select value={action.config.level || ""} onChange={e => updateAction(action.id, { config: { ...action.config, level: e.target.value } })} className="w-full p-2 border-2 rounded-lg text-sm">
                  <option value="">-- Seleziona livello --</option>
                  {FUNNEL_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              )}

              {action.type === "webhook" && (
                <input type="url" placeholder="https://webhook-url..." value={action.config.url || ""} onChange={e => updateAction(action.id, { config: { ...action.config, url: e.target.value } })} className="w-full p-2 border-2 rounded-lg text-sm" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
