import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Power, GitBranch, Clock, Zap } from "lucide-react";
import * as service from "../../lib/emailAutomationService";
import * as templateService from "../../lib/emailTemplateService";
import * as funnelService from "../../lib/funnelService";
import { CAMPAIGN_CATEGORIES, FUNNEL_LEVELS } from "../../types";
import type {
  EmailAutomation, AutomationStep, AutomationTriggerType,
  EmailTemplateV2, LandingPageDoc, Funnel,
} from "../../types";

const TRIGGERS: { value: AutomationTriggerType; label: string; emoji: string; description: string }[] = [
  { value: "lead_created", label: "Nuova lead", emoji: "🎯", description: "Quando arriva una lead" },
  { value: "form_submitted", label: "Modulo compilato", emoji: "📝", description: "Lead da modulo contatto" },
  { value: "booking_made", label: "Prenotazione fatta", emoji: "📅", description: "Slot prenotato" },
  { value: "booking_canceled", label: "Prenotazione annullata", emoji: "❌", description: "Slot cancellato" },
  { value: "tag_added", label: "Tag aggiunto", emoji: "🏷️", description: "Tag specifico assegnato" },
  { value: "level_changed", label: "Livello cambiato", emoji: "📊", description: "Lead promosso di livello" },
  { value: "manual_trigger", label: "Manuale", emoji: "👋", description: "Avvio a mano dal CRM" },
];

export default function EmailAutomationsManager() {
  const [automations, setAutomations] = useState<EmailAutomation[]>([]);
  const [editing, setEditing] = useState<EmailAutomation | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    setAutomations(await service.getAutomations());
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const create = async () => {
    const a = await service.addAutomation({
      name: "Nuova Sequenza",
      description: "",
      enabled: false,
      trigger: "lead_created",
      steps: [],
    });
    refresh();
    setEditing(a);
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminare questa automazione?")) return;
    await service.deleteAutomation(id);
    refresh();
  };

  const toggle = async (a: EmailAutomation) => {
    await service.updateAutomation(a.id, { enabled: !a.enabled });
    refresh();
  };

  if (editing) {
    return <AutomationEditor automation={editing} onClose={() => { setEditing(null); refresh(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Email Automation</h2>
          <p className="text-gray-500 text-sm">Sequenze email automatiche dopo un evento</p>
        </div>
        <button onClick={create} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2">
          <Plus size={18} /> Nuova Sequenza
        </button>
      </div>

      {loading ? (
        <p>Caricamento...</p>
      ) : automations.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed">
          <Zap size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-xl font-black mb-2">Nessuna automazione</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Crea sequenze email tipo: "quando arriva una lead, manda email subito + dopo 1h promemoria + dopo 3 giorni follow-up"
          </p>
          <button onClick={create} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold">
            + Crea la prima sequenza
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map(a => {
            const trigger = TRIGGERS.find(t => t.value === a.trigger);
            return (
              <div key={a.id} className="bg-white p-5 rounded-2xl shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{trigger?.emoji}</span>
                      <h3 className="font-black truncate">{a.name}</h3>
                      <button
                        onClick={() => toggle(a)}
                        className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${a.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {a.enabled ? "ATTIVA" : "DISATTIVA"}
                      </button>
                    </div>
                    {a.description && <p className="text-xs text-gray-600 mb-2">{a.description}</p>}
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
                        Trigger: {trigger?.label}
                      </span>
                      <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold">
                        {a.steps?.length || 0} step
                      </span>
                      {a.totalEnrolled !== undefined && (
                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold">
                          {a.totalEnrolled} iscritti
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setEditing(a)} className="p-2 rounded-lg hover:bg-gray-100"><Edit2 size={16} /></button>
                    <button onClick={() => remove(a.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =====================================================
// EDITOR
// =====================================================
function AutomationEditor({ automation, onClose }: { automation: EmailAutomation; onClose: () => void }) {
  const [data, setData] = useState<EmailAutomation>(automation);
  const [templates, setTemplates] = useState<EmailTemplateV2[]>([]);
  const [landings, setLandings] = useState<LandingPageDoc[]>([]);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    (async () => {
      setTemplates(await templateService.getEmailTemplates());
      setLandings(await funnelService.getLandings());
      setFunnels(await funnelService.getFunnels());
    })();
  }, []);

  const update = (patch: Partial<EmailAutomation>) => setData(prev => ({ ...prev, ...patch }));

  const save = async () => {
    await service.updateAutomation(automation.id, data);
    setSavedMsg("✓ Salvato");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  // Steps
  const addStep = () => {
    const newStep: AutomationStep = {
      id: `step_${Date.now()}`,
      order: data.steps.length,
      delayType: data.steps.length === 0 ? "immediate" : "hours",
      delayValue: data.steps.length === 0 ? 0 : 24,
      templateId: templates[0]?.id || "",
    };
    update({ steps: [...data.steps, newStep] });
  };
  const updateStep = (i: number, patch: Partial<AutomationStep>) => {
    const newSteps = [...data.steps];
    newSteps[i] = { ...newSteps[i], ...patch };
    update({ steps: newSteps });
  };
  const removeStep = (i: number) => {
    const newSteps = data.steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx }));
    update({ steps: newSteps });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between sticky top-0 bg-gray-50 z-10 py-2">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 border-2 rounded-xl font-bold">← Indietro</button>
          <h2 className="text-2xl font-black truncate">{data.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && <span className="text-green-600 font-bold text-sm">{savedMsg}</span>}
          <button onClick={save} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold">Salva</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card title="Configurazione base">
            <Field label="Nome">
              <input type="text" value={data.name} onChange={e => update({ name: e.target.value })} className="input" />
            </Field>
            <Field label="Descrizione (opzionale)">
              <textarea value={data.description || ""} onChange={e => update({ description: e.target.value })} className="input" rows={2} />
            </Field>
            <Field label="Stato">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={data.enabled} onChange={e => update({ enabled: e.target.checked })} />
                <span className="text-sm font-bold">Attiva</span>
              </label>
            </Field>
          </Card>

          <Card title="Trigger (quando avviare)">
            <Field label="Evento che innesca">
              <div className="grid grid-cols-2 gap-2">
                {TRIGGERS.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => update({ trigger: t.value })}
                    className={`p-3 rounded-xl border-2 text-left text-xs ${data.trigger === t.value ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  >
                    <div className="font-bold flex items-center gap-1">{t.emoji} {t.label}</div>
                    <div className="text-[10px] text-gray-500">{t.description}</div>
                  </button>
                ))}
              </div>
            </Field>

            {data.trigger === "tag_added" && (
              <Field label="Quale tag?" hint="Solo quando viene aggiunto questo tag">
                <input type="text" value={data.triggerTagFilter || ""} onChange={e => update({ triggerTagFilter: e.target.value })} className="input" placeholder="Es: prenotato" />
              </Field>
            )}
          </Card>

          <Card title="Filtri (opzionali)" hint="Lascia vuoto per applicare a tutti i lead">
            <Field label="Solo per landing">
              <select value={data.filterLandingId || ""} onChange={e => update({ filterLandingId: e.target.value || undefined })} className="input">
                <option value="">Tutte</option>
                {landings.map(l => <option key={l.id} value={l.id}>{l.internalName}</option>)}
              </select>
            </Field>
            <Field label="Solo per funnel">
              <select value={data.filterFunnelId || ""} onChange={e => update({ filterFunnelId: e.target.value || undefined })} className="input">
                <option value="">Tutti</option>
                {funnels.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </Field>
            <Field label="Solo per servizio">
              <select value={data.filterService || ""} onChange={e => update({ filterService: e.target.value || undefined })} className="input">
                <option value="">Tutti</option>
                {CAMPAIGN_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Solo per livello">
              <select value={data.filterFunnelLevel || ""} onChange={e => update({ filterFunnelLevel: (e.target.value || undefined) as any })} className="input">
                <option value="">Tutti</option>
                {FUNNEL_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </Field>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title={`Sequenza email (${data.steps.length} step)`}>
            {data.steps.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">
                Nessuno step. Click sotto per aggiungere il primo.
              </p>
            ) : (
              <div className="space-y-3">
                {data.steps.sort((a, b) => a.order - b.order).map((step, i) => (
                  <div key={step.id}>
                    <StepCard
                      step={step}
                      index={i}
                      templates={templates}
                      onChange={patch => updateStep(i, patch)}
                      onRemove={() => removeStep(i)}
                    />
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={addStep}
              className="w-full py-2.5 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-50"
            >
              <Plus size={14} /> Aggiungi step
            </button>

            {templates.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-900 mt-3">
                ⚠️ Non hai ancora template email. Vai in <strong>Email → Template</strong> per crearne almeno uno.
              </div>
            )}
          </Card>
        </div>
      </div>

      <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; border: 2px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.875rem; } .input:focus { outline: none; border-color: #3b82f6; }`}</style>
    </div>
  );
}

// =====================================================
// STEP CARD
// =====================================================
function StepCard({ step, index, templates, onChange, onRemove }: {
  step: AutomationStep;
  index: number;
  templates: EmailTemplateV2[];
  onChange: (patch: Partial<AutomationStep>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border-2 rounded-xl p-3 bg-gray-50 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">{index + 1}</div>
          <span className="text-xs font-bold">Step {index + 1}</span>
        </div>
        <button onClick={onRemove} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={12} /></button>
      </div>

      <div>
        <label className="block text-[10px] font-bold mb-1 uppercase text-gray-500">Quando inviare</label>
        <div className="flex gap-1">
          <select value={step.delayType} onChange={e => onChange({ delayType: e.target.value as any })} className="input flex-1 text-xs py-1.5">
            <option value="immediate">Subito</option>
            <option value="minutes">Dopo X minuti</option>
            <option value="hours">Dopo X ore</option>
            <option value="days">Dopo X giorni</option>
          </select>
          {step.delayType !== "immediate" && (
            <input
              type="number"
              min={1}
              value={step.delayValue}
              onChange={e => onChange({ delayValue: parseInt(e.target.value) || 1 })}
              className="input w-20 text-xs py-1.5"
            />
          )}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold mb-1 uppercase text-gray-500">Email da inviare</label>
        <select value={step.templateId} onChange={e => onChange({ templateId: e.target.value })} className="input text-xs py-1.5">
          <option value="">— Seleziona template —</option>
          {templates.map(t => <option key={t.id} value={t.id}>{t.internalName}</option>)}
        </select>
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer font-bold text-blue-600">⚙️ Opzioni avanzate</summary>
        <div className="space-y-2 mt-2 pl-2 border-l-2 border-blue-200">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={step.skipIfBookingMade || false}
              onChange={e => onChange({ skipIfBookingMade: e.target.checked })}
              className="mt-0.5"
            />
            <span className="text-[11px]">Salta se il lead ha già prenotato</span>
          </label>
          <div>
            <label className="block text-[10px] font-bold mb-1">Tag da aggiungere dopo invio (separati da virgola)</label>
            <input
              type="text"
              value={(step.addTagsAfterSend || []).join(", ")}
              onChange={e => onChange({ addTagsAfterSend: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
              className="input text-xs py-1"
              placeholder="Es: contattato, primo_followup"
            />
          </div>
        </div>
      </details>
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
