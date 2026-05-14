import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Eye, Mail, FileText, Code } from "lucide-react";
import * as service from "../../lib/emailTemplateService";
import type { EmailTemplateV2, EmailTemplateCategory } from "../../types";

const CATEGORIES: { value: EmailTemplateCategory; label: string; emoji: string }[] = [
  { value: "benvenuto", label: "Benvenuto", emoji: "👋" },
  { value: "promemoria", label: "Promemoria", emoji: "⏰" },
  { value: "follow_up", label: "Follow-up", emoji: "📞" },
  { value: "marketing", label: "Marketing", emoji: "📢" },
  { value: "transazionale", label: "Transazionale", emoji: "🔔" },
  { value: "altro", label: "Altro", emoji: "📨" },
];

const SAMPLE_VARS = {
  nome: "Maria Rossi",
  cognome: "Rossi",
  telefono: "333 1234567",
  email: "maria.rossi@esempio.it",
  landing: "Implantologia Maggio",
  funnel: "Funnel Implantologia",
  livello: "lead_caldo",
  studio: "Studio Dentistico Ricciardi",
  studio_telefono: "+39 02 1234567",
  studio_email: "info@studio.it",
  studio_indirizzo: "Via Roma 12, Milano",
  studio_orari: "Lun-Ven 9-19",
  booking_url: "https://miosito.com/prenota",
};

export default function EmailTemplatesManager() {
  const [templates, setTemplates] = useState<EmailTemplateV2[]>([]);
  const [editing, setEditing] = useState<EmailTemplateV2 | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    setTemplates(await service.getEmailTemplates());
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const create = async () => {
    const tpl = await service.addEmailTemplate({
      internalName: "Nuovo template",
      category: "altro",
      subject: "Oggetto email",
      editorMode: "simple",
      bodyText: "Ciao {{nome}},\n\nGrazie per averci contattato!\n\nCordiali saluti,\n{{studio}}",
      ctaButtonLabel: "",
      ctaButtonUrl: "",
      footerText: "{{studio}} · {{studio_telefono}} · {{studio_email}}",
    });
    refresh();
    setEditing(tpl);
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminare questo template?")) return;
    await service.deleteEmailTemplate(id);
    refresh();
  };

  if (editing) {
    return <TemplateEditor template={editing} onClose={() => { setEditing(null); refresh(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Template Email</h2>
          <p className="text-gray-500 text-sm">Crea email riusabili per automazioni e campagne</p>
        </div>
        <button onClick={create} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2">
          <Plus size={18} /> Nuovo Template
        </button>
      </div>

      {loading ? (
        <p>Caricamento...</p>
      ) : templates.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed">
          <Mail size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-xl font-black mb-2">Nessun template</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Crea template di email per il benvenuto, i promemoria, il follow-up. Li userai poi nelle automazioni e campagne.
          </p>
          <button onClick={create} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold">
            + Crea il primo template
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => {
            const cat = CATEGORIES.find(c => c.value === t.category);
            return (
              <div key={t.id} className="bg-white p-5 rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-300 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-2xl flex-shrink-0">{cat?.emoji || "📨"}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black truncate">{t.internalName}</h3>
                      <p className="text-[10px] text-gray-400 uppercase">{cat?.label}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${t.editorMode === "html" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                    {t.editorMode === "html" ? "HTML" : "EASY"}
                  </span>
                </div>
                <div className="text-xs text-gray-700 font-bold mb-1 line-clamp-1">{t.subject}</div>
                <div className="text-[11px] text-gray-500 line-clamp-2 mb-4">{t.bodyText || t.bodyHtml?.replace(/<[^>]*>/g, "").slice(0, 100)}</div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(t)} className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-100">
                    <Edit2 size={12} /> Modifica
                  </button>
                  <button onClick={() => remove(t.id)} className="px-3 py-2 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                    <Trash2 size={12} />
                  </button>
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
// TEMPLATE EDITOR
// =====================================================
function TemplateEditor({ template, onClose }: { template: EmailTemplateV2; onClose: () => void }) {
  const [data, setData] = useState<EmailTemplateV2>(template);
  const [savedMsg, setSavedMsg] = useState("");
  const [showPreview, setShowPreview] = useState(true);

  const update = (patch: Partial<EmailTemplateV2>) => setData(prev => ({ ...prev, ...patch }));

  const save = async () => {
    await service.updateEmailTemplate(template.id, data);
    setSavedMsg("✓ Salvato");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const rendered = service.renderTemplateForEmail(data, SAMPLE_VARS);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between sticky top-0 bg-gray-50 z-10 py-2">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 border-2 rounded-xl font-bold">← Indietro</button>
          <h2 className="text-2xl font-black truncate">{data.internalName}</h2>
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && <span className="text-green-600 font-bold text-sm">{savedMsg}</span>}
          <button onClick={() => setShowPreview(!showPreview)} className="px-4 py-2 border-2 rounded-xl font-bold flex items-center gap-1">
            <Eye size={14} /> {showPreview ? "Nascondi" : "Anteprima"}
          </button>
          <button onClick={save} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold">Salva</button>
        </div>
      </div>

      <div className={`grid gap-4 ${showPreview ? "lg:grid-cols-2" : ""}`}>
        {/* EDITOR */}
        <div className="space-y-4">
          <Card title="Informazioni base">
            <Field label="Nome interno" hint="Solo per identificarlo nella lista">
              <input type="text" value={data.internalName} onChange={e => update({ internalName: e.target.value })} className="input" />
            </Field>
            <Field label="Categoria">
              <select value={data.category} onChange={e => update({ category: e.target.value as any })} className="input">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
              </select>
            </Field>
            <Field label="Modalità editor">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => update({ editorMode: "simple" })}
                  className={`flex-1 px-3 py-2 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-1 ${data.editorMode === "simple" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                >
                  <FileText size={14} /> Easy
                </button>
                <button
                  type="button"
                  onClick={() => update({ editorMode: "html" })}
                  className={`flex-1 px-3 py-2 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-1 ${data.editorMode === "html" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                >
                  <Code size={14} /> HTML avanzato
                </button>
              </div>
            </Field>
          </Card>

          <Card title="Contenuto email">
            <Field label="Oggetto" hint="Usa {{nome}}, {{studio}}, ecc.">
              <input type="text" value={data.subject} onChange={e => update({ subject: e.target.value })} className="input" />
            </Field>

            {data.editorMode === "simple" ? (
              <>
                <Field label="Testo principale" hint="Vai a capo per nuovi paragrafi">
                  <textarea value={data.bodyText || ""} onChange={e => update({ bodyText: e.target.value })} className="input font-mono text-xs" rows={10} />
                </Field>
                <Field label="Testo bottone CTA (opzionale)" hint="Lascia vuoto per non avere bottone">
                  <input type="text" value={data.ctaButtonLabel || ""} onChange={e => update({ ctaButtonLabel: e.target.value })} className="input" placeholder="Es: Prenota una visita" />
                </Field>
                {data.ctaButtonLabel && (
                  <Field label="URL bottone CTA">
                    <input type="url" value={data.ctaButtonUrl || ""} onChange={e => update({ ctaButtonUrl: e.target.value })} className="input" placeholder="https://..." />
                  </Field>
                )}
                <Field label="Footer (opzionale)">
                  <input type="text" value={data.footerText || ""} onChange={e => update({ footerText: e.target.value })} className="input" placeholder="Es: {{studio}} · {{studio_telefono}}" />
                </Field>
              </>
            ) : (
              <Field label="HTML" hint="HTML completo dell'email">
                <textarea value={data.bodyHtml || ""} onChange={e => update({ bodyHtml: e.target.value })} className="input font-mono text-[11px]" rows={20} />
              </Field>
            )}

            <div className="bg-blue-50 p-3 rounded-xl text-xs">
              <div className="font-bold mb-1">Variabili disponibili:</div>
              <div className="font-mono text-[10px] grid grid-cols-2 gap-x-2 gap-y-0.5">
                {Object.keys(SAMPLE_VARS).map(k => <div key={k}>{`{{${k}}}`}</div>)}
              </div>
            </div>
          </Card>
        </div>

        {/* PREVIEW */}
        {showPreview && (
          <div className="lg:sticky lg:top-20 lg:self-start">
            <Card title="Anteprima (con dati di esempio)">
              <div className="border-2 rounded-xl bg-gray-100 p-3 space-y-2">
                <div className="bg-white p-2 rounded-lg text-[10px] font-bold uppercase text-gray-500">
                  Da: {data.internalName} &lt;noreply@studio.it&gt;
                </div>
                <div className="bg-white p-2 rounded-lg text-[10px] font-bold uppercase text-gray-500">
                  A: maria.rossi@esempio.it
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-xs font-bold mb-2">{rendered.subject}</div>
                </div>
                <div className="bg-white rounded-lg overflow-hidden" style={{ height: 600 }}>
                  <iframe srcDoc={rendered.html} className="w-full h-full border-0" title="Preview" />
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; border: 2px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.875rem; } .input:focus { outline: none; border-color: #3b82f6; }`}</style>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white p-5 rounded-2xl space-y-3">
      <h3 className="font-black text-sm">{title}</h3>
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
