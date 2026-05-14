import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, RefreshCw, Globe, MessageSquare, Tag } from "lucide-react";
import * as manualService from "../../lib/manualReviewsService";
import * as googleService from "../../lib/googleReviewsService";
import * as settingsService from "../../lib/settingsService";
import type { ManualReview, GoogleReviewsCache, AppSettings } from "../../types";

type Tab = "google" | "manual";

export default function ReviewsManager() {
  const [tab, setTab] = useState<Tab>("manual");
  const [manualReviews, setManualReviews] = useState<ManualReview[]>([]);
  const [googleCache, setGoogleCache] = useState<GoogleReviewsCache | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ManualReview | null>(null);
  const [refreshingGoogle, setRefreshingGoogle] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const [m, g, s] = await Promise.all([
      manualService.getManualReviews(),
      googleService.getGoogleReviewsCache(),
      settingsService.getAppSettings(),
    ]);
    setManualReviews(m);
    setGoogleCache(g);
    setSettings(s);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  if (editing) {
    return <ManualReviewEditor review={editing} onClose={() => { setEditing(null); refresh(); }} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Recensioni</h2>
        <p className="text-gray-500 text-sm">Gestisci recensioni Google e manuali da mostrare nelle landing</p>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b-2 border-gray-100">
        <button
          onClick={() => setTab("manual")}
          className={`px-4 py-2 font-bold text-sm flex items-center gap-2 border-b-2 ${tab === "manual" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
        >
          <MessageSquare size={16} /> Manuali ({manualReviews.length})
        </button>
        <button
          onClick={() => setTab("google")}
          className={`px-4 py-2 font-bold text-sm flex items-center gap-2 border-b-2 ${tab === "google" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
        >
          <Globe size={16} /> Da Google ({googleCache?.reviews?.length || 0})
        </button>
      </div>

      {loading ? <p>Caricamento...</p> : tab === "manual" ? (
        <ManualReviewsTab
          reviews={manualReviews}
          onEdit={setEditing}
          onRefresh={refresh}
        />
      ) : (
        <GoogleReviewsTab
          cache={googleCache}
          settings={settings}
          refreshing={refreshingGoogle}
          onRefresh={async () => {
            if (!settings?.googlePlaceId) {
              alert("Configura il Place ID dello studio in Impostazioni → Recensioni Google");
              return;
            }
            setRefreshingGoogle(true);
            const res = await googleService.refreshGoogleReviews(settings.googlePlaceId);
            if (res.ok) {
              await refresh();
            } else {
              alert(`Errore: ${res.error}`);
            }
            setRefreshingGoogle(false);
          }}
        />
      )}
    </div>
  );
}

// =====================================================
// MANUAL REVIEWS TAB
// =====================================================
function ManualReviewsTab({
  reviews,
  onEdit,
  onRefresh,
}: {
  reviews: ManualReview[];
  onEdit: (r: ManualReview) => void;
  onRefresh: () => void;
}) {
  const create = async () => {
    const r = await manualService.addManualReview({
      authorName: "Nuova recensione",
      text: "",
      rating: 5,
      serviceTags: [],
      visible: true,
      source: "google",
    });
    onRefresh();
    onEdit(r);
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminare questa recensione?")) return;
    await manualService.deleteManualReview(id);
    onRefresh();
  };

  const toggleVisible = async (r: ManualReview) => {
    await manualService.updateManualReview(r.id, { visible: !r.visible });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Recensioni "verbali", da WhatsApp, email o copiate da Google. Le puoi taggare per servizio.
        </p>
        <button onClick={create} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2">
          <Plus size={18} /> Nuova
        </button>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed">
          <MessageSquare size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-xl font-black mb-2">Nessuna recensione manuale</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Crea recensioni manuali da abbinare ai servizi per le tue landing. Es: 5 recensioni con tag "sbiancamento".
          </p>
          <button onClick={create} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold">
            + Crea la prima
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {reviews.map(r => (
            <div key={r.id} className={`bg-white p-4 rounded-2xl shadow-sm border-2 ${r.visible ? "border-transparent" : "border-yellow-200 bg-yellow-50"}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="font-black truncate flex-1">{r.authorName}</div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} size={12} className={n <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-700 line-clamp-3 mb-3">{r.text || <em className="text-gray-400">(vuoto)</em>}</p>
              {r.serviceTags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {r.serviceTags.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold">{t}</span>
                  ))}
                </div>
              )}
              <div className="flex gap-1">
                <button onClick={() => onEdit(r)} className="flex-1 px-2 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-blue-100">
                  <Edit2 size={11} /> Modifica
                </button>
                <button onClick={() => toggleVisible(r)} className="px-2 py-1.5 border rounded-lg" title={r.visible ? "Nascondi" : "Pubblica"}>
                  {r.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                </button>
                <button onClick={() => remove(r.id)} className="px-2 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                  <Trash2 size={11} />
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
// GOOGLE REVIEWS TAB
// =====================================================
function GoogleReviewsTab({
  cache,
  settings,
  refreshing,
  onRefresh,
}: {
  cache: GoogleReviewsCache | null;
  settings: AppSettings | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const hasConfig = !!(settings?.googlePlacesApiKey && settings?.googlePlaceId);
  const cacheValid = googleService.isCacheValid(cache);

  return (
    <div className="space-y-4">
      {!hasConfig && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <h4 className="font-bold mb-1">⚠️ Configurazione mancante</h4>
          <p className="text-xs">
            Per usare le recensioni Google, vai in <strong>Sistema → Impostazioni & API</strong> e configura:
          </p>
          <ul className="text-xs list-disc pl-5 mt-1 space-y-1">
            <li><strong>Google Places API Key</strong> — la trovi su Google Cloud Console</li>
            <li><strong>Place ID dello studio</strong> — lo trovi su <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener" className="underline text-blue-700">questo strumento</a></li>
          </ul>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl flex flex-wrap items-center gap-3 justify-between">
        <div>
          <div className="text-xs text-gray-500">Stato cache</div>
          {cache ? (
            <div className="text-sm">
              <strong>{cache.studioName || "Studio"}</strong> · ⭐ {cache.averageRating} ({cache.totalRatings} rec.)
              <div className="text-[11px] text-gray-500">
                Aggiornata {new Date(cache.cachedAt).toLocaleString("it-IT")} ·{" "}
                <span className={cacheValid ? "text-green-700" : "text-red-700"}>{cacheValid ? "Valida" : "Scaduta"}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Nessuna cache</div>
          )}
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing || !hasConfig}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Aggiornamento..." : "Aggiorna ora"}
        </button>
      </div>

      {cache && cache.reviews.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cache.reviews.map((r, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="font-black truncate flex-1">{r.authorName}</div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} size={12} className={n <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-700 line-clamp-4 mb-1">{r.text}</p>
              <p className="text-[10px] text-gray-400">{r.relativeTime}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs space-y-1">
        <p className="font-bold">Come funziona:</p>
        <p>· Google ti dà <strong>massimo 5 recensioni</strong> alla volta (limite API)</p>
        <p>· Le memorizziamo in cache per 24h così non chiamiamo Google a ogni visita (e non paghi extra)</p>
        <p>· Click su "Aggiorna ora" per forzare il refresh prima delle 24h</p>
        <p>· Nelle landing puoi filtrare per parole chiave (es: solo recensioni che contengono "sbiancamento")</p>
      </div>
    </div>
  );
}

// =====================================================
// MANUAL REVIEW EDITOR
// =====================================================
function ManualReviewEditor({ review, onClose }: { review: ManualReview; onClose: () => void }) {
  const [data, setData] = useState<ManualReview>(review);
  const [savedMsg, setSavedMsg] = useState("");

  const update = (patch: Partial<ManualReview>) => setData(prev => ({ ...prev, ...patch }));

  const save = async () => {
    await manualService.updateManualReview(review.id, data);
    setSavedMsg("✓ Salvato");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 border-2 rounded-xl font-bold">← Indietro</button>
          <h2 className="text-2xl font-black truncate">Recensione</h2>
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && <span className="text-green-600 font-bold text-sm">{savedMsg}</span>}
          <button onClick={save} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold">Salva</button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl space-y-3">
        <Field label="Nome autore">
          <input type="text" value={data.authorName} onChange={e => update({ authorName: e.target.value })} className="input" />
        </Field>

        <Field label="URL foto autore (opzionale)">
          <input type="url" value={data.authorPhoto || ""} onChange={e => update({ authorPhoto: e.target.value })} className="input" placeholder="https://..." />
        </Field>

        <Field label="Testo recensione">
          <textarea value={data.text} onChange={e => update({ text: e.target.value })} className="input" rows={5} />
        </Field>

        <Field label="Voto (1-5 stelle)">
          <div className="flex gap-1">
            {[1,2,3,4,5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => update({ rating: n })}
                className="p-1"
              >
                <Star size={28} className={n <= data.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
              </button>
            ))}
          </div>
        </Field>

        <Field label="Tag servizio (separati da virgola)" hint='Es: "sbiancamento, faccette, urgenza"'>
          <input
            type="text"
            value={(data.serviceTags || []).join(", ")}
            onChange={e => update({ serviceTags: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
            className="input"
            placeholder="sbiancamento, faccette"
          />
        </Field>

        <Field label="Fonte">
          <select value={data.source || "altro"} onChange={e => update({ source: e.target.value as any })} className="input">
            <option value="google">Google</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="instagram">Instagram</option>
            <option value="verbale">Verbale</option>
            <option value="altro">Altro</option>
          </select>
        </Field>

        <Field label="Data recensione (opzionale)">
          <input type="date" value={data.reviewDate || ""} onChange={e => update({ reviewDate: e.target.value })} className="input" />
        </Field>

        <Field label="URL recensione originale (opzionale)">
          <input type="url" value={data.sourceUrl || ""} onChange={e => update({ sourceUrl: e.target.value })} className="input" placeholder="https://..." />
        </Field>

        <Field label="Visibile">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={data.visible !== false} onChange={e => update({ visible: e.target.checked })} />
            <span className="text-sm">Pubblicata e mostrabile nelle landing</span>
          </label>
        </Field>
      </div>

      <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; border: 2px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.875rem; } .input:focus { outline: none; border-color: #3b82f6; }`}</style>
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
