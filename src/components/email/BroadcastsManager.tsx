import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Send, Users, Mail, Eye } from "lucide-react";
import * as service from "../../lib/broadcastService";
import * as templateService from "../../lib/emailTemplateService";
import * as funnelService from "../../lib/funnelService";
import { callSendBroadcast } from "../../lib/apiClient";
import { CAMPAIGN_CATEGORIES, FUNNEL_LEVELS, LEAD_STATUSES } from "../../types";
import type {
  BroadcastCampaign, EmailTemplateV2,
  Lead, LandingPageDoc, Funnel, FunnelLevel, LeadStatus,
} from "../../types";

export default function BroadcastsManager() {
  const [broadcasts, setBroadcasts] = useState<BroadcastCampaign[]>([]);
  const [editing, setEditing] = useState<BroadcastCampaign | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    setBroadcasts(await service.getBroadcasts());
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const create = async () => {
    const b = await service.addBroadcast({
      name: "Nuova campagna",
      status: "draft",
      subject: "Oggetto email",
      bodyText: "",
      editorMode: "simple",
      audienceFilters: {
        marketingConsentRequired: true,
        excludeUnsubscribed: true,
      },
      manuallyIncludedLeadIds: [],
      manuallyExcludedLeadIds: [],
    });
    refresh();
    setEditing(b);
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminare questa campagna?")) return;
    await service.deleteBroadcast(id);
    refresh();
  };

  if (editing) {
    return <BroadcastEditor broadcast={editing} onClose={() => { setEditing(null); refresh(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Email Marketing</h2>
          <p className="text-gray-500 text-sm">Invia campagne broadcast a gruppi di lead</p>
        </div>
        <button onClick={create} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2">
          <Plus size={18} /> Nuova Campagna
        </button>
      </div>

      {loading ? (
        <p>Caricamento...</p>
      ) : broadcasts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed">
          <Send size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-xl font-black mb-2">Nessuna campagna</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Crea campagne per inviare la stessa email a un gruppo di lead. Esempio: promo natalizia a tutti i lead "tiepido".
          </p>
          <button onClick={create} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold">
            + Crea la prima campagna
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {broadcasts.map(b => (
            <div key={b.id} className="bg-white p-5 rounded-2xl shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Send size={16} className="text-blue-600" />
                    <h3 className="font-black truncate">{b.name}</h3>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-xs text-gray-600 mb-2 truncate">📨 {b.subject}</p>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {b.totalSent !== undefined && b.totalSent > 0 && (
                      <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold">
                        {b.totalSent} inviate
                      </span>
                    )}
                    {b.totalFailed !== undefined && b.totalFailed > 0 && (
                      <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold">
                        {b.totalFailed} fallite
                      </span>
                    )}
                    {b.actualRecipients !== undefined && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
                        {b.actualRecipients} destinatari
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setEditing(b)} className="p-2 rounded-lg hover:bg-gray-100">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => remove(b.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: BroadcastCampaign["status"] }) {
  const colors = {
    draft: "bg-gray-100 text-gray-600",
    scheduled: "bg-yellow-100 text-yellow-700",
    sending: "bg-blue-100 text-blue-700 animate-pulse",
    sent: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };
  const labels = { draft: "Bozza", scheduled: "Pianificata", sending: "In invio", sent: "Inviata", failed: "Fallita" };
  return <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${colors[status]}`}>{labels[status]}</span>;
}

// =====================================================
// EDITOR
// =====================================================
function BroadcastEditor({ broadcast, onClose }: { broadcast: BroadcastCampaign; onClose: () => void }) {
  const [data, setData] = useState<BroadcastCampaign>(broadcast);
  const [templates, setTemplates] = useState<EmailTemplateV2[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [landings, setLandings] = useState<LandingPageDoc[]>([]);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [savedMsg, setSavedMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [previewRecipients, setPreviewRecipients] = useState<Lead[]>([]);

  useEffect(() => {
    (async () => {
      const [tpls, lds, fnls, lndngs] = await Promise.all([
        templateService.getEmailTemplates(),
        funnelService.getLeads(),
        funnelService.getFunnels(),
        funnelService.getLandings(),
      ]);
      setTemplates(tpls);
      setLeads(lds);
      setFunnels(fnls);
      setLandings(lndngs);
    })();
  }, []);

  // Ricalcola anteprima destinatari ogni volta che cambia un filtro
  useEffect(() => {
    const filtered = service.filterLeadsForBroadcast(
      leads,
      data.audienceFilters,
      data.manuallyIncludedLeadIds || [],
      data.manuallyExcludedLeadIds || []
    );
    setPreviewRecipients(filtered);
  }, [leads, data.audienceFilters, data.manuallyIncludedLeadIds, data.manuallyExcludedLeadIds]);

  const update = (patch: Partial<BroadcastCampaign>) => setData(prev => ({ ...prev, ...patch }));
  const updateFilters = (patch: Partial<BroadcastCampaign["audienceFilters"]>) =>
    update({ audienceFilters: { ...data.audienceFilters, ...patch } });

  const save = async () => {
    await service.updateBroadcast(broadcast.id, data);
    setSavedMsg("✓ Salvato");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const sendNow = async () => {
    if (data.status === "sent") {
      alert("Questa campagna è già stata inviata.");
      return;
    }
    if (previewRecipients.length === 0) {
      alert("Nessun destinatario corrisponde ai filtri.");
      return;
    }
    if (!data.subject || (!data.bodyText && !data.bodyHtml)) {
      alert("Inserisci almeno oggetto e corpo.");
      return;
    }
    if (!confirm(`Stai per inviare a ${previewRecipients.length} destinatari. Continuare?`)) return;

    // Salva prima
    await service.updateBroadcast(broadcast.id, data);

    setSending(true);
    try {
      const result = await callSendBroadcast(broadcast.id);
      if (result.ok) {
        alert(`✅ Invio completato!\n\n${result.totalSent} email inviate\n${result.totalFailed} fallite`);
      } else {
        alert(`❌ Errore: ${result.error}`);
      }
      onClose();
    } catch (e: any) {
      alert(`❌ Errore: ${e?.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between sticky top-0 bg-gray-50 z-10 py-2">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 border-2 rounded-xl font-bold">← Indietro</button>
          <h2 className="text-2xl font-black truncate">{data.name}</h2>
          <StatusBadge status={data.status} />
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && <span className="text-green-600 font-bold text-sm">{savedMsg}</span>}
          <button onClick={save} className="px-4 py-2 border-2 rounded-xl font-bold">Salva bozza</button>
          {data.status !== "sent" && (
            <button
              onClick={sendNow}
              disabled={sending || previewRecipients.length === 0}
              className="px-5 py-3 bg-green-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
            >
              {sending ? <>Invio...</> : <><Send size={16} /> Invia ora</>}
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* CONTENUTO + AUDIENCE */}
        <div className="lg:col-span-2 space-y-4">
          <Card title="Informazioni base">
            <Field label="Nome campagna (interno)">
              <input type="text" value={data.name} onChange={e => update({ name: e.target.value })} className="input" />
            </Field>
          </Card>

          <Card title="Contenuto email">
            <Field label="Usa template esistente (opzionale)">
              <select value={data.templateId || ""} onChange={e => {
                const tpl = templates.find(t => t.id === e.target.value);
                if (tpl) {
                  update({
                    templateId: tpl.id,
                    subject: tpl.subject,
                    bodyText: tpl.bodyText,
                    bodyHtml: tpl.bodyHtml,
                    editorMode: tpl.editorMode,
                    ctaButtonLabel: tpl.ctaButtonLabel,
                    ctaButtonUrl: tpl.ctaButtonUrl,
                  });
                } else {
                  update({ templateId: undefined });
                }
              }} className="input">
                <option value="">— Custom (scrivi sotto) —</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.internalName}</option>)}
              </select>
            </Field>
            <Field label="Modalità editor">
              <div className="flex gap-2">
                <button type="button" onClick={() => update({ editorMode: "simple" })} className={`flex-1 px-3 py-2 rounded-xl border-2 text-sm font-bold ${data.editorMode === "simple" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>Easy</button>
                <button type="button" onClick={() => update({ editorMode: "html" })} className={`flex-1 px-3 py-2 rounded-xl border-2 text-sm font-bold ${data.editorMode === "html" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>HTML</button>
              </div>
            </Field>
            <Field label="Oggetto">
              <input type="text" value={data.subject} onChange={e => update({ subject: e.target.value })} className="input" placeholder="Es: Una promo speciale per te, {{nome}}" />
            </Field>
            {data.editorMode === "simple" ? (
              <>
                <Field label="Testo principale">
                  <textarea value={data.bodyText || ""} onChange={e => update({ bodyText: e.target.value })} className="input font-mono text-xs" rows={8} />
                </Field>
                <Field label="Testo bottone CTA (opzionale)">
                  <input type="text" value={data.ctaButtonLabel || ""} onChange={e => update({ ctaButtonLabel: e.target.value })} className="input" placeholder="Es: Prenota ora" />
                </Field>
                {data.ctaButtonLabel && (
                  <Field label="URL bottone">
                    <input type="url" value={data.ctaButtonUrl || ""} onChange={e => update({ ctaButtonUrl: e.target.value })} className="input" />
                  </Field>
                )}
              </>
            ) : (
              <Field label="HTML completo">
                <textarea value={data.bodyHtml || ""} onChange={e => update({ bodyHtml: e.target.value })} className="input font-mono text-[11px]" rows={15} />
              </Field>
            )}
          </Card>

          <Card title="Filtri destinatari" hint="Chi riceverà questa email">
            <Field label="Solo da queste landing">
              <MultiCheck
                options={landings.map(l => ({ value: l.id, label: l.internalName }))}
                value={data.audienceFilters.landingIds || []}
                onChange={v => updateFilters({ landingIds: v })}
              />
            </Field>
            <Field label="Solo da questi funnel">
              <MultiCheck
                options={funnels.map(f => ({ value: f.id, label: f.name }))}
                value={data.audienceFilters.funnelIds || []}
                onChange={v => updateFilters({ funnelIds: v })}
              />
            </Field>
            <Field label="Solo livelli">
              <MultiCheck
                options={FUNNEL_LEVELS.map(l => ({ value: l.value, label: l.label }))}
                value={data.audienceFilters.funnelLevels || []}
                onChange={v => updateFilters({ funnelLevels: v as FunnelLevel[] })}
              />
            </Field>
            <Field label="Solo stato">
              <MultiCheck
                options={LEAD_STATUSES.map(s => ({ value: s.value, label: s.label }))}
                value={data.audienceFilters.statuses || []}
                onChange={v => updateFilters({ statuses: v as LeadStatus[] })}
              />
            </Field>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={data.audienceFilters.marketingConsentRequired} onChange={e => updateFilters({ marketingConsentRequired: e.target.checked })} />
                <span><strong>Richiedi consenso marketing</strong> (consigliato per GDPR)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={data.audienceFilters.excludeUnsubscribed} onChange={e => updateFilters({ excludeUnsubscribed: e.target.checked })} />
                <span>Escludi chi si è disiscritto (tag "unsubscribed")</span>
              </label>
            </div>
          </Card>
        </div>

        {/* SIDEBAR ANTEPRIMA */}
        <div className="lg:sticky lg:top-20 lg:self-start space-y-4">
          <Card title="📊 Audience">
            <div className="text-center py-4">
              <div className="text-5xl font-black text-blue-600 mb-1">{previewRecipients.length}</div>
              <div className="text-xs text-gray-500">destinatari stimati</div>
            </div>
            <div className="text-[11px] text-gray-500 max-h-64 overflow-y-auto border-t pt-2">
              {previewRecipients.slice(0, 20).map(l => (
                <div key={l.id} className="py-1 border-b border-gray-100">
                  <div className="font-bold text-gray-900 truncate">{l.firstName} {l.lastName}</div>
                  <div className="truncate">{l.email || "(no email)"}</div>
                </div>
              ))}
              {previewRecipients.length > 20 && (
                <div className="text-center pt-2 italic">
                  + altri {previewRecipients.length - 20}...
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; border: 2px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.875rem; } .input:focus { outline: none; border-color: #3b82f6; }`}</style>
    </div>
  );
}

function MultiCheck({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  if (options.length === 0) return <p className="text-[11px] text-gray-400 italic">Nessun elemento</p>;
  return (
    <div className="space-y-1 max-h-40 overflow-y-auto border-2 rounded-xl p-2">
      {options.map(opt => (
        <label key={opt.value} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer text-xs">
          <input
            type="checkbox"
            checked={value.includes(opt.value)}
            onChange={e => {
              if (e.target.checked) onChange([...value, opt.value]);
              else onChange(value.filter(v => v !== opt.value));
            }}
          />
          {opt.label}
        </label>
      ))}
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
