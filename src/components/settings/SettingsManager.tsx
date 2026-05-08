import React, { useEffect, useState } from "react";
import { Save, Eye, EyeOff, Check, AlertCircle, Key, Building2, Mail } from "lucide-react";
import * as settingsService from "../../lib/settingsService";
import type { AppSettings } from "../../types";

export default function SettingsManager() {
  const [data, setData] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedMsg, setSavedMsg] = useState("");
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showResendKey, setShowResendKey] = useState(false);
  const [section, setSection] = useState<"keys" | "studio" | "email">("keys");

  useEffect(() => {
    (async () => {
      setData(await settingsService.getAppSettings());
      setLoading(false);
    })();
  }, []);

  if (loading || !data) return <p>Caricamento...</p>;

  const update = (patch: Partial<AppSettings>) => setData(prev => ({ ...(prev as AppSettings), ...patch }));

  const save = async () => {
    await settingsService.updateAppSettings(data);
    setSavedMsg("✓ Impostazioni salvate");
    setTimeout(() => setSavedMsg(""), 3000);
  };

  const chatConfigured = settingsService.settingsAreConfiguredForChat(data);
  const emailConfigured = settingsService.settingsAreConfiguredForEmail(data);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Impostazioni</h2>
          <p className="text-gray-500 text-sm">API keys, dati studio, configurazione email</p>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-green-600 font-bold text-sm">{savedMsg}</span>}
          <button onClick={save} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2">
            <Save size={16} /> Salva
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <StatusCard
          title="Chat AI"
          configured={chatConfigured}
          configuredText="Pronta per ricevere conversazioni reali"
          notConfiguredText="Inserisci la API key Anthropic per attivarla"
        />
        <StatusCard
          title="Notifiche Email"
          configured={emailConfigured}
          configuredText="Pronte per inviare email reali"
          notConfiguredText="Inserisci API key Resend e indirizzo mittente"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-1 inline-flex gap-1">
        <button onClick={() => setSection("keys")} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${section === "keys" ? "bg-blue-600 text-white" : ""}`}>
          <Key size={14} /> API Keys
        </button>
        <button onClick={() => setSection("studio")} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${section === "studio" ? "bg-blue-600 text-white" : ""}`}>
          <Building2 size={14} /> Studio
        </button>
        <button onClick={() => setSection("email")} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${section === "email" ? "bg-blue-600 text-white" : ""}`}>
          <Mail size={14} /> Email Provider
        </button>
      </div>

      {/* SECTION: API KEYS */}
      {section === "keys" && (
        <div className="space-y-4">
          <Card title="🤖 Anthropic API Key (per Chat AI)">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-xs text-amber-900">
              ⚠️ <strong>Sicurezza:</strong> La key viene salvata in Firestore. Le chiamate all'AI passano sempre da <code>/api/chat</code> (server-side), mai direttamente dal browser.
            </div>
            <Field label="API Key" hint="Inizia con 'sk-ant-...'">
              <div className="flex gap-2">
                <input
                  type={showAnthropicKey ? "text" : "password"}
                  value={data.anthropicApiKey || ""}
                  onChange={e => update({ anthropicApiKey: e.target.value })}
                  className="input flex-1"
                  placeholder="sk-ant-api03-..."
                />
                <button onClick={() => setShowAnthropicKey(!showAnthropicKey)} className="px-3 border-2 rounded-lg">
                  {showAnthropicKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            <Field label="Modello" hint="Claude Haiku è il più economico, ottimo per chat">
              <select value={data.anthropicModel || "claude-haiku-4-5-20251001"} onChange={e => update({ anthropicModel: e.target.value })} className="input">
                <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (consigliato — economico)</option>
                <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5 (più intelligente, costa di più)</option>
              </select>
            </Field>
            <p className="text-[11px] text-gray-500">
              Ottieni una key gratuita su <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" className="underline">console.anthropic.com</a>
            </p>
          </Card>

          <Card title="✉️ Resend API Key (per Email)">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-xs text-amber-900">
              ⚠️ Le email vengono inviate solo dal server tramite <code>/api/send-email</code>.
            </div>
            <Field label="API Key" hint="Inizia con 're_...'">
              <div className="flex gap-2">
                <input
                  type={showResendKey ? "text" : "password"}
                  value={data.resendApiKey || ""}
                  onChange={e => update({ resendApiKey: e.target.value })}
                  className="input flex-1"
                  placeholder="re_..."
                />
                <button onClick={() => setShowResendKey(!showResendKey)} className="px-3 border-2 rounded-lg">
                  {showResendKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            <p className="text-[11px] text-gray-500">
              Ottieni una key (gratis fino a 3000 email/mese) su <a href="https://resend.com" target="_blank" rel="noreferrer" className="underline">resend.com</a>
            </p>
          </Card>

          <Card title="🔧 Feature globali">
            <Toggle label="Chat globalmente attiva" hint="Disattiva tutte le chat in un colpo" checked={data.chatGloballyEnabled} onChange={v => update({ chatGloballyEnabled: v })} />
            <Toggle label="Notifiche globalmente attive" checked={data.notificationsGloballyEnabled} onChange={v => update({ notificationsGloballyEnabled: v })} />
          </Card>
        </div>
      )}

      {/* SECTION: STUDIO */}
      {section === "studio" && (
        <Card title="Informazioni Studio" hint="Usate dalla chat e nelle email">
          <Field label="Nome studio">
            <input type="text" value={data.studioName || ""} onChange={e => update({ studioName: e.target.value })} className="input" placeholder="Studio Dentistico Ricciardi" />
          </Field>
          <Field label="Indirizzo">
            <input type="text" value={data.studioAddress || ""} onChange={e => update({ studioAddress: e.target.value })} className="input" placeholder="Via Roma 123, Milano" />
          </Field>
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Telefono">
              <input type="tel" value={data.studioPhone || ""} onChange={e => update({ studioPhone: e.target.value })} className="input" placeholder="+39 02 1234567" />
            </Field>
            <Field label="Email studio">
              <input type="email" value={data.studioEmail || ""} onChange={e => update({ studioEmail: e.target.value })} className="input" placeholder="info@studio.it" />
            </Field>
          </div>
          <Field label="Sito web">
            <input type="url" value={data.studioWebsite || ""} onChange={e => update({ studioWebsite: e.target.value })} className="input" placeholder="https://" />
          </Field>
          <Field label="Orari di apertura">
            <textarea value={data.studioOpeningHours || ""} onChange={e => update({ studioOpeningHours: e.target.value })} className="input" rows={3} placeholder="Lun-Ven 9:00-19:00, Sab 9:00-13:00" />
          </Field>
          <Field label="URL Dashboard" hint="Per i link nelle email (es. https://miosito.com)">
            <input type="url" value={data.dashboardBaseUrl || ""} onChange={e => update({ dashboardBaseUrl: e.target.value })} className="input" placeholder="https://miosito.com" />
          </Field>
          <Field label="Colore brand primario">
            <input type="color" value={data.brandPrimaryColor || "#0066A1"} onChange={e => update({ brandPrimaryColor: e.target.value })} className="w-full h-12 rounded-xl border-2" />
          </Field>
        </Card>
      )}

      {/* SECTION: EMAIL */}
      {section === "email" && (
        <Card title="Configurazione mittente">
          <Field label="Nome mittente" hint="Nome che apparirà come 'Da'">
            <input type="text" value={data.emailFromName || ""} onChange={e => update({ emailFromName: e.target.value })} className="input" placeholder="Studio Dentistico" />
          </Field>
          <Field label="Email mittente" hint="Deve essere un dominio verificato su Resend">
            <input type="email" value={data.emailFromAddress || ""} onChange={e => update({ emailFromAddress: e.target.value })} className="input" placeholder="noreply@tuodominio.it" />
          </Field>
          <Field label="Email Reply-To (opzionale)" hint="Dove vanno le risposte">
            <input type="email" value={data.emailReplyTo || ""} onChange={e => update({ emailReplyTo: e.target.value })} className="input" placeholder="info@tuodominio.it" />
          </Field>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
            <strong>📌 Verifica dominio Resend:</strong> Per inviare email da un dominio personalizzato, devi verificarlo su Resend aggiungendo i record DNS richiesti (SPF, DKIM, DMARC). Senza verifica puoi solo inviare da <code>onboarding@resend.dev</code>.
          </div>
        </Card>
      )}

      <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; border: 2px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.875rem; } .input:focus { outline: none; border-color: #3b82f6; }`}</style>
    </div>
  );
}

// =====================================================
// Mini-componenti
// =====================================================
function StatusCard({ title, configured, configuredText, notConfiguredText }: { title: string; configured: boolean; configuredText: string; notConfiguredText: string }) {
  return (
    <div className={`p-5 rounded-2xl border-2 ${configured ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
      <div className="flex items-start gap-3">
        <div>
          {configured ? <Check size={24} className="text-green-600" /> : <AlertCircle size={24} className="text-orange-600" />}
        </div>
        <div>
          <h3 className="font-black mb-1">{title}</h3>
          <p className={`text-xs ${configured ? "text-green-800" : "text-orange-800"}`}>
            {configured ? configuredText : notConfiguredText}
          </p>
        </div>
      </div>
    </div>
  );
}

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
      <label className="block text-xs font-bold mb-1">{label}</label>
      {hint && <p className="text-[11px] text-gray-500 mb-1">{hint}</p>}
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
