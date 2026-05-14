import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, ExternalLink, Copy, Eye, EyeOff } from "lucide-react";
import * as funnelService from "../../lib/funnelService";
import { LANDING_TEMPLATES, CAMPAIGN_CATEGORIES } from "../../types";
import type { LandingPageDoc, LandingTemplateType } from "../../types";
import { LANDING_TEMPLATE_DEFINITIONS } from "../../lib/landingTemplates";

export default function LandingsManager() {
  const [landings, setLandings] = useState<LandingPageDoc[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<LandingPageDoc | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    setLandings(await funnelService.getLandings());
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const createFromTemplate = async (templateType: LandingTemplateType, name: string, slug: string, category: string) => {
    const def = LANDING_TEMPLATE_DEFINITIONS[templateType];
    const now = new Date().toISOString();
    const newLanding: Omit<LandingPageDoc, "id"> = {
      internalName: name,
      slug,
      goal: def.description,
      category,
      templateType,
      headline: def.defaultHeadline,
      subtitle: def.defaultSubtitle,
      heroImage: "",
      blocks: def.blocks(),
      ctaText: def.defaultCta,
      primaryColor: def.primaryColor,
      secondaryColor: def.secondaryColor,
      status: "bozza",
      createdAt: now,
      updatedAt: now,
      views: 0,
      conversions: 0,
    };
    await funnelService.addLanding(newLanding);
    setShowNew(false);
    refresh();
  };

  const deleteLanding = async (id: string) => {
    if (!confirm("Eliminare definitivamente questa landing?")) return;
    await funnelService.deleteLanding(id);
    refresh();
  };

  const duplicate = async (l: LandingPageDoc) => {
    const { id, ...rest } = l;
    await funnelService.addLanding({
      ...rest,
      internalName: `${l.internalName} (copia)`,
      slug: `${l.slug}-copia`,
      status: "bozza",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    refresh();
  };

  const togglePublish = async (l: LandingPageDoc) => {
    const newStatus = l.status === "pubblicata" ? "bozza" : "pubblicata";
    await funnelService.updateLanding(l.id, { status: newStatus });
    refresh();
  };

  if (editing) {
    return <LandingEditor landing={editing} onClose={() => { setEditing(null); refresh(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Landing Pages</h2>
          <p className="text-gray-500 text-sm">Gestisci le landing page delle tue campagne</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} /> Nuova Landing
        </button>
      </div>

      {showNew && <NewLandingModal onCreate={createFromTemplate} onClose={() => setShowNew(false)} />}

      {loading ? (
        <p>Caricamento...</p>
      ) : landings.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed">
          <p className="text-gray-500 mb-4">Nessuna landing creata. Inizia da un template.</p>
          <button onClick={() => setShowNew(true)} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold">
            Crea la prima
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {landings.map(l => (
            <div key={l.id} className="bg-white p-6 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-black text-lg text-gray-900">{l.internalName}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    l.status === "pubblicata" ? "bg-green-100 text-green-700" :
                    l.status === "bozza" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>{l.status}</span>
                </div>
                <p className="text-sm text-gray-500">/{l.slug} · {l.templateType} · {l.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePublish(l)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  title={l.status === "pubblicata" ? "Rendi bozza" : "Pubblica"}
                >
                  {l.status === "pubblicata" ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                {l.status === "pubblicata" && (
                  <a href={`/l/${l.slug}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-gray-100" title="Apri">
                    <ExternalLink size={18} />
                  </a>
                )}
                <button onClick={() => duplicate(l)} className="p-2 rounded-lg hover:bg-gray-100" title="Duplica">
                  <Copy size={18} />
                </button>
                <button onClick={() => setEditing(l)} className="p-2 rounded-lg hover:bg-gray-100" title="Modifica">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => deleteLanding(l.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Elimina">
                  <Trash2 size={18} />
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
// NEW LANDING MODAL
// =====================================================
function NewLandingModal({
  onCreate,
  onClose,
}: {
  onCreate: (t: LandingTemplateType, name: string, slug: string, category: string) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"template" | "details">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<LandingTemplateType | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState<string>("implantologia");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black">Nuova Landing</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900">✕</button>
        </div>

        {step === "template" && (
          <>
            <p className="text-gray-600 mb-4">Scegli un template di partenza</p>
            <div className="grid md:grid-cols-2 gap-4">
              {LANDING_TEMPLATES.map(t => (
                <button
                  key={t.value}
                  onClick={() => { setSelectedTemplate(t.value); setStep("details"); }}
                  className="p-5 border-2 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <h3 className="font-black text-lg mb-1">{t.label}</h3>
                  <p className="text-sm text-gray-600">{t.description}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {step === "details" && selectedTemplate && (
          <>
            <p className="text-gray-600 mb-4">
              Template selezionato: <strong>{LANDING_TEMPLATES.find(t => t.value === selectedTemplate)?.label}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Nome interno</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                  }}
                  className="w-full p-3 border-2 rounded-xl"
                  placeholder="Es: Campagna Implantologia Maggio"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Slug URL</label>
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  className="w-full p-3 border-2 rounded-xl"
                  placeholder="es: implantologia-maggio"
                />
                <p className="text-xs text-gray-500 mt-1">URL: /l/{slug || "..."}</p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Categoria campagna</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full p-3 border-2 rounded-xl"
                >
                  {CAMPAIGN_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep("template")} className="px-5 py-3 border-2 rounded-xl font-bold">
                Indietro
              </button>
              <button
                onClick={() => name && slug && onCreate(selectedTemplate, name, slug, category)}
                disabled={!name || !slug}
                className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50"
              >
                Crea Landing
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =====================================================
// LANDING EDITOR
// =====================================================
function LandingEditor({ landing, onClose }: { landing: LandingPageDoc; onClose: () => void }) {
  const [data, setData] = useState<LandingPageDoc>(landing);
  const [forms, setForms] = useState<any[]>([]);
  const [funnels, setFunnels] = useState<any[]>([]);
  const [thankYous, setThankYous] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    (async () => {
      setForms(await funnelService.getContactForms());
      setFunnels(await funnelService.getFunnels());
      setThankYous(await funnelService.getThankYouPages());
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await funnelService.updateLanding(landing.id, data);
      setSavedMsg("Salvato!");
      setTimeout(() => setSavedMsg(""), 2000);
    } catch (e) {
      setSavedMsg("Errore");
    }
    setSaving(false);
  };

  const updateBlock = (blockId: string, newData: any) => {
    setData(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === blockId ? { ...b, data: newData } : b),
    }));
  };

  const toggleBlockVisibility = (blockId: string) => {
    setData(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === blockId ? { ...b, visible: !b.visible } : b),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-0 bg-gray-50 z-10 py-4">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="px-4 py-2 border-2 rounded-xl font-bold">← Indietro</button>
          <h2 className="text-2xl font-black">Modifica: {landing.internalName}</h2>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-green-600 font-bold">{savedMsg}</span>}
          <button onClick={save} disabled={saving} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50">
            {saving ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </div>

      {/* Info base */}
      <div className="bg-white p-6 rounded-2xl space-y-4">
        <h3 className="font-black text-lg">Informazioni base</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">Nome interno</label>
            <input type="text" value={data.internalName} onChange={e => setData({...data, internalName: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Slug URL</label>
            <input type="text" value={data.slug} onChange={e => setData({...data, slug: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Headline</label>
            <input type="text" value={data.headline} onChange={e => setData({...data, headline: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Sottotitolo</label>
            <input type="text" value={data.subtitle} onChange={e => setData({...data, subtitle: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Hero image (URL)</label>
            <input type="text" value={data.heroImage || ""} onChange={e => setData({...data, heroImage: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">CTA Text</label>
            <input type="text" value={data.ctaText} onChange={e => setData({...data, ctaText: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Colore primario</label>
            <input type="color" value={data.primaryColor || "#0066A1"} onChange={e => setData({...data, primaryColor: e.target.value})} className="w-full h-12 border-2 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Colore secondario</label>
            <input type="color" value={data.secondaryColor || "#96C8E6"} onChange={e => setData({...data, secondaryColor: e.target.value})} className="w-full h-12 border-2 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Collegamenti */}
      <div className="bg-white p-6 rounded-2xl space-y-4">
        <h3 className="font-black text-lg">Collegamenti</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">Modulo collegato</label>
            <select value={data.formId || ""} onChange={e => setData({...data, formId: e.target.value || undefined})} className="w-full p-3 border-2 rounded-xl">
              <option value="">Nessuno</option>
              {forms.map(f => <option key={f.id} value={f.id}>{f.internalName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Funnel collegato</label>
            <select value={data.funnelId || ""} onChange={e => setData({...data, funnelId: e.target.value || undefined})} className="w-full p-3 border-2 rounded-xl">
              <option value="">Nessuno</option>
              {funnels.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Thank You Page</label>
            <select value={data.thankYouPageId || ""} onChange={e => setData({...data, thankYouPageId: e.target.value || undefined})} className="w-full p-3 border-2 rounded-xl">
              <option value="">Default</option>
              {thankYous.map(t => <option key={t.id} value={t.id}>{t.internalName}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Tracking / Pixel */}
      <div className="bg-white p-6 rounded-2xl space-y-4">
        <h3 className="font-black text-lg">📊 Tracking & Pixel</h3>
        <p className="text-xs text-gray-500">
          Configura Facebook Pixel e Google Tag per tracciare conversioni. Se non li metti qui, vengono usati quelli globali da Impostazioni → Tracking.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">Facebook Pixel ID</label>
            <input
              type="text"
              value={data.facebookPixelId || ""}
              onChange={e => setData({...data, facebookPixelId: e.target.value || undefined})}
              className="w-full p-3 border-2 rounded-xl font-mono text-sm"
              placeholder="123456789012345"
            />
            <p className="text-[10px] text-gray-500 mt-1">Solo numeri (15 cifre)</p>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Google Tag ID (GA4 o GTM)</label>
            <input
              type="text"
              value={data.googleTagId || ""}
              onChange={e => setData({...data, googleTagId: e.target.value || undefined})}
              className="w-full p-3 border-2 rounded-xl font-mono text-sm"
              placeholder="G-XXXXXXXXXX o GTM-XXXXXXX"
            />
            <p className="text-[10px] text-gray-500 mt-1">G-XXXX per GA4, GTM-XXXX per Tag Manager</p>
          </div>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={data.trackPageView !== false} onChange={e => setData({...data, trackPageView: e.target.checked})} />
            <span className="text-sm font-bold">Traccia visite pagina (PageView)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={data.trackFormSubmission !== false} onChange={e => setData({...data, trackFormSubmission: e.target.checked})} />
            <span className="text-sm font-bold">Traccia compilazione form (Lead)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={data.trackBookingMade !== false} onChange={e => setData({...data, trackBookingMade: e.target.checked})} />
            <span className="text-sm font-bold">Traccia prenotazione (Schedule)</span>
          </label>
        </div>
      </div>

      {/* Recensioni */}
      <div className="bg-white p-6 rounded-2xl space-y-4">
        <h3 className="font-black text-lg">⭐ Recensioni nella landing</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.reviewsEnabled || false}
            onChange={e => setData({...data, reviewsEnabled: e.target.checked})}
          />
          <span className="font-bold">Mostra recensioni in questa landing</span>
        </label>

        {data.reviewsEnabled && (
          <div className="pl-6 space-y-3 border-l-2 border-blue-200">
            <div className="grid md:grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.reviewsShowGoogle || false}
                  onChange={e => setData({...data, reviewsShowGoogle: e.target.checked})}
                />
                <span className="text-sm font-bold">Recensioni Google (cache)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.reviewsShowManual !== false}
                  onChange={e => setData({...data, reviewsShowManual: e.target.checked})}
                />
                <span className="text-sm font-bold">Recensioni manuali</span>
              </label>
            </div>

            {data.reviewsShowGoogle && (
              <div>
                <label className="block text-sm font-bold mb-1">Filtra Google per parole chiave (opzionale)</label>
                <input
                  type="text"
                  value={(data.reviewsKeywordFilter || []).join(", ")}
                  onChange={e => setData({...data, reviewsKeywordFilter: e.target.value.split(",").map(s => s.trim()).filter(Boolean)})}
                  className="w-full p-3 border-2 rounded-xl"
                  placeholder="Es: sbiancamento, smile, denti bianchi"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Mostra solo recensioni che contengono almeno una di queste parole. Lascia vuoto per mostrare tutte.
                </p>
              </div>
            )}

            {data.reviewsShowManual !== false && (
              <div>
                <label className="block text-sm font-bold mb-1">Tag recensioni manuali (opzionale)</label>
                <input
                  type="text"
                  value={(data.reviewsManualTags || []).join(", ")}
                  onChange={e => setData({...data, reviewsManualTags: e.target.value.split(",").map(s => s.trim()).filter(Boolean)})}
                  className="w-full p-3 border-2 rounded-xl"
                  placeholder="Es: sbiancamento, faccette"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Mostra solo recensioni manuali con questi tag servizio. Lascia vuoto per mostrare tutte le visibili.
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">Quante mostrare</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={data.reviewsMaxCount || 5}
                  onChange={e => setData({...data, reviewsMaxCount: parseInt(e.target.value) || 5})}
                  className="w-full p-3 border-2 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Layout</label>
                <select
                  value={data.reviewsLayout || "grid"}
                  onChange={e => setData({...data, reviewsLayout: e.target.value as any})}
                  className="w-full p-3 border-2 rounded-xl"
                >
                  <option value="grid">Griglia</option>
                  <option value="carousel">Carosello</option>
                  <option value="list">Lista</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.reviewsShowSummaryWidget !== false}
                onChange={e => setData({...data, reviewsShowSummaryWidget: e.target.checked})}
              />
              <span className="text-sm">Mostra widget riepilogo Google (⭐ X.X/5 · N recensioni · Link)</span>
            </label>
          </div>
        )}
      </div>

      {/* Blocchi */}
      <div className="bg-white p-6 rounded-2xl space-y-4">
        <h3 className="font-black text-lg">Blocchi contenuto ({data.blocks.length})</h3>
        <div className="space-y-3">
          {[...data.blocks].sort((a, b) => a.order - b.order).map(block => (
            <details key={block.id} className="border-2 rounded-xl">
              <summary className="p-4 cursor-pointer flex items-center justify-between font-bold">
                <span className={block.visible ? "" : "text-gray-400"}>
                  #{block.order} · {block.type} {!block.visible && "(nascosto)"}
                </span>
                <button onClick={(e) => { e.preventDefault(); toggleBlockVisibility(block.id); }} className="text-sm text-blue-600">
                  {block.visible ? "Nascondi" : "Mostra"}
                </button>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <textarea
                  value={JSON.stringify(block.data, null, 2)}
                  onChange={(e) => {
                    try {
                      updateBlock(block.id, JSON.parse(e.target.value));
                    } catch {}
                  }}
                  className="w-full p-3 border-2 rounded-xl font-mono text-xs"
                  rows={10}
                />
                <p className="text-xs text-gray-500 mt-2">Modifica direttamente il JSON del blocco. In una versione futura potrai modificarlo con un editor visuale.</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
