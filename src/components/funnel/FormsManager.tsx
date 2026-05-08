import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import * as funnelService from "../../lib/funnelService";
import { FUNNEL_LEVELS } from "../../types";
import type { ContactForm, FormField, FormFieldType, ThankYouPage } from "../../types";

const FIELD_TYPES: { value: FormFieldType; label: string }[] = [
  { value: "text", label: "Testo" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Telefono" },
  { value: "textarea", label: "Area testo" },
  { value: "select", label: "Menu a tendina" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio" },
  { value: "date", label: "Data" },
  { value: "time", label: "Ora" },
  { value: "number", label: "Numero" },
];

// Form templates
const FORM_TEMPLATES = {
  contact: (): Omit<ContactForm, "id"> => ({
    internalName: "Modulo Contatto Base",
    fields: [
      { id: "f1", name: "firstName", label: "Nome", type: "text", required: true, order: 1 },
      { id: "f2", name: "lastName", label: "Cognome", type: "text", required: true, order: 2 },
      { id: "f3", name: "phone", label: "Telefono", type: "phone", required: true, order: 3 },
      { id: "f4", name: "email", label: "Email", type: "email", required: true, order: 4 },
      { id: "f5", name: "message", label: "Messaggio", type: "textarea", required: false, order: 5 },
    ],
    privacyConsentRequired: true,
    marketingConsentEnabled: true,
    privacyText: "Accetto la privacy policy",
    afterSubmitAction: "show_thank_you",
    tagsToAssign: [],
    createdAt: new Date().toISOString(),
  }),
  urgency: (): Omit<ContactForm, "id"> => ({
    internalName: "Modulo Urgenza",
    fields: [
      { id: "f1", name: "firstName", label: "Nome", type: "text", required: true, order: 1 },
      { id: "f2", name: "phone", label: "Telefono", type: "phone", required: true, order: 2 },
      { id: "f3", name: "problemType", label: "Tipo di problema", type: "select", required: true, order: 3, options: ["Dolore intenso", "Trauma", "Gonfiore", "Altro"] },
      { id: "f4", name: "duration", label: "Da quanto tempo?", type: "text", required: true, order: 4 },
      { id: "f5", name: "preferredTime", label: "Preferenza oraria", type: "text", required: false, order: 5 },
    ],
    privacyConsentRequired: true,
    marketingConsentEnabled: false,
    afterSubmitAction: "show_thank_you",
    tagsToAssign: ["urgenza"],
    funnelLevelToAssign: "urgenza",
    createdAt: new Date().toISOString(),
  }),
  booking: (): Omit<ContactForm, "id"> => ({
    internalName: "Modulo Prenotazione Visita",
    fields: [
      { id: "f1", name: "firstName", label: "Nome", type: "text", required: true, order: 1 },
      { id: "f2", name: "phone", label: "Telefono", type: "phone", required: true, order: 2 },
      { id: "f3", name: "email", label: "Email", type: "email", required: true, order: 3 },
      { id: "f4", name: "treatment", label: "Trattamento di interesse", type: "select", required: true, order: 4, options: ["Visita generale", "Implantologia", "Igiene", "Ortodonzia", "Sbiancamento"] },
      { id: "f5", name: "preferredDay", label: "Giorno preferito", type: "date", required: false, order: 5 },
      { id: "f6", name: "preferredTime", label: "Fascia oraria", type: "select", required: false, order: 6, options: ["Mattina", "Pomeriggio", "Sera"] },
    ],
    privacyConsentRequired: true,
    marketingConsentEnabled: true,
    afterSubmitAction: "show_booking",
    tagsToAssign: ["prenotazione"],
    createdAt: new Date().toISOString(),
  }),
  leadMagnet: (): Omit<ContactForm, "id"> => ({
    internalName: "Modulo Lead Magnet",
    fields: [
      { id: "f1", name: "firstName", label: "Nome", type: "text", required: true, order: 1 },
      { id: "f2", name: "email", label: "Email", type: "email", required: true, order: 2 },
      { id: "f3", name: "phone", label: "Telefono (opzionale)", type: "phone", required: false, order: 3 },
    ],
    privacyConsentRequired: true,
    marketingConsentEnabled: true,
    afterSubmitAction: "show_thank_you",
    tagsToAssign: ["lead_magnet"],
    funnelLevelToAssign: "solo_informativo",
    createdAt: new Date().toISOString(),
  }),
};

export default function FormsManager() {
  const [forms, setForms] = useState<ContactForm[]>([]);
  const [thankYous, setThankYous] = useState<ThankYouPage[]>([]);
  const [editing, setEditing] = useState<ContactForm | null>(null);
  const [showNew, setShowNew] = useState(false);

  const refresh = async () => {
    setForms(await funnelService.getContactForms());
    setThankYous(await funnelService.getThankYouPages());
  };
  useEffect(() => { refresh(); }, []);

  const createFromTemplate = async (key: keyof typeof FORM_TEMPLATES) => {
    await funnelService.addContactForm(FORM_TEMPLATES[key]());
    setShowNew(false);
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminare questo modulo?")) return;
    await funnelService.deleteContactForm(id);
    refresh();
  };

  if (editing) {
    return <FormEditor form={editing} thankYous={thankYous} onClose={() => { setEditing(null); refresh(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Moduli Contatto</h2>
          <p className="text-gray-500 text-sm">Crea moduli personalizzati per ogni esigenza</p>
        </div>
        <button onClick={() => setShowNew(true)} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2">
          <Plus size={18} /> Nuovo Modulo
        </button>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white p-8 rounded-3xl max-w-2xl w-full">
            <h3 className="text-xl font-black mb-6">Scegli un template</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { k: "contact", label: "Contatto base", desc: "Nome, telefono, email, messaggio" },
                { k: "urgency", label: "Urgenza", desc: "Per richieste urgenti" },
                { k: "booking", label: "Prenotazione", desc: "Visita con trattamento" },
                { k: "leadMagnet", label: "Lead Magnet", desc: "Solo email per scaricare" },
              ].map(t => (
                <button key={t.k} onClick={() => createFromTemplate(t.k as any)} className="p-5 border-2 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-left">
                  <h4 className="font-black mb-1">{t.label}</h4>
                  <p className="text-xs text-gray-600">{t.desc}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setShowNew(false)} className="mt-4 px-4 py-2 border-2 rounded-xl font-bold">Annulla</button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {forms.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed">
            <p className="text-gray-500">Nessun modulo ancora.</p>
          </div>
        ) : forms.map(f => (
          <div key={f.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-bold">{f.internalName}</h3>
              <p className="text-xs text-gray-500">{f.fields.length} campi · azione: {f.afterSubmitAction}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(f)} className="p-2 rounded-lg hover:bg-gray-100"><Edit2 size={18} /></button>
              <button onClick={() => remove(f.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormEditor({ form, thankYous, onClose }: { form: ContactForm; thankYous: ThankYouPage[]; onClose: () => void }) {
  const [data, setData] = useState<ContactForm>(form);
  const [savedMsg, setSavedMsg] = useState("");

  const save = async () => {
    await funnelService.updateContactForm(form.id, data);
    setSavedMsg("Salvato!");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const addField = () => {
    const newField: FormField = {
      id: `f_${Date.now()}`,
      name: `field_${data.fields.length + 1}`,
      label: "Nuovo campo",
      type: "text",
      required: false,
      order: data.fields.length + 1,
    };
    setData({ ...data, fields: [...data.fields, newField] });
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setData({ ...data, fields: data.fields.map(f => f.id === id ? { ...f, ...updates } : f) });
  };

  const removeField = (id: string) => {
    setData({ ...data, fields: data.fields.filter(f => f.id !== id) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="px-4 py-2 border-2 rounded-xl font-bold">← Indietro</button>
          <h2 className="text-2xl font-black">Modifica Modulo</h2>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-green-600 font-bold">{savedMsg}</span>}
          <button onClick={save} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold">Salva</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl space-y-4">
        <input type="text" value={data.internalName} onChange={e => setData({...data, internalName: e.target.value})} className="w-full p-3 border-2 rounded-xl font-bold text-lg" placeholder="Nome interno" />
        <textarea value={data.description || ""} onChange={e => setData({...data, description: e.target.value})} className="w-full p-3 border-2 rounded-xl" placeholder="Descrizione (opzionale)" rows={2} />
      </div>

      <div className="bg-white p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-lg">Campi modulo</h3>
          <button onClick={addField} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold text-sm flex items-center gap-1">
            <Plus size={14} /> Aggiungi campo
          </button>
        </div>
        <div className="space-y-3">
          {[...data.fields].sort((a, b) => a.order - b.order).map(field => (
            <div key={field.id} className="border-2 rounded-xl p-4 grid grid-cols-12 gap-3 items-center">
              <input type="number" value={field.order} onChange={e => updateField(field.id, { order: parseInt(e.target.value) || 0 })} className="col-span-1 p-2 border-2 rounded-lg" />
              <input type="text" value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} className="col-span-3 p-2 border-2 rounded-lg" placeholder="Label" />
              <input type="text" value={field.name} onChange={e => updateField(field.id, { name: e.target.value })} className="col-span-2 p-2 border-2 rounded-lg" placeholder="name" />
              <select value={field.type} onChange={e => updateField(field.id, { type: e.target.value as FormFieldType })} className="col-span-2 p-2 border-2 rounded-lg">
                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <label className="col-span-2 flex items-center gap-1 text-sm">
                <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} />
                Obblig.
              </label>
              <input type="text" value={field.placeholder || ""} onChange={e => updateField(field.id, { placeholder: e.target.value })} className="col-span-1 p-2 border-2 rounded-lg" placeholder="ph" />
              <button onClick={() => removeField(field.id)} className="col-span-1 p-2 text-red-600"><Trash2 size={16} /></button>
              {(field.type === "select" || field.type === "radio") && (
                <input
                  type="text"
                  value={(field.options || []).join(", ")}
                  onChange={e => updateField(field.id, { options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                  className="col-span-12 p-2 border-2 rounded-lg"
                  placeholder="Opzioni separate da virgola"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl space-y-4">
        <h3 className="font-black text-lg">Privacy & Consensi</h3>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={data.privacyConsentRequired} onChange={e => setData({...data, privacyConsentRequired: e.target.checked})} />
          <span className="text-sm font-bold">Consenso privacy obbligatorio</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={data.marketingConsentEnabled} onChange={e => setData({...data, marketingConsentEnabled: e.target.checked})} />
          <span className="text-sm font-bold">Consenso marketing disponibile</span>
        </label>
        <input type="text" value={data.privacyText || ""} onChange={e => setData({...data, privacyText: e.target.value})} className="w-full p-3 border-2 rounded-xl" placeholder="Testo privacy" />
      </div>

      <div className="bg-white p-6 rounded-2xl space-y-4">
        <h3 className="font-black text-lg">Azione dopo invio</h3>
        <select value={data.afterSubmitAction} onChange={e => setData({...data, afterSubmitAction: e.target.value as any})} className="w-full p-3 border-2 rounded-xl">
          <option value="show_thank_you">Mostra Thank You Page</option>
          <option value="show_booking">Mostra prenotazione</option>
          <option value="redirect_url">Redirect a URL</option>
          <option value="show_message">Mostra messaggio</option>
        </select>
        {data.afterSubmitAction === "show_thank_you" && (
          <select value={data.thankYouPageId || ""} onChange={e => setData({...data, thankYouPageId: e.target.value || undefined})} className="w-full p-3 border-2 rounded-xl">
            <option value="">Default</option>
            {thankYous.map(t => <option key={t.id} value={t.id}>{t.internalName}</option>)}
          </select>
        )}
        {data.afterSubmitAction === "redirect_url" && (
          <input type="url" value={data.redirectUrl || ""} onChange={e => setData({...data, redirectUrl: e.target.value})} className="w-full p-3 border-2 rounded-xl" placeholder="https://..." />
        )}

        <h4 className="font-bold mt-4">Tag e livello da assegnare</h4>
        <input type="text" value={(data.tagsToAssign || []).join(", ")} onChange={e => setData({...data, tagsToAssign: e.target.value.split(",").map(s => s.trim()).filter(Boolean)})} className="w-full p-3 border-2 rounded-xl" placeholder="tag1, tag2..." />
        <select value={data.funnelLevelToAssign || ""} onChange={e => setData({...data, funnelLevelToAssign: (e.target.value || undefined) as any})} className="w-full p-3 border-2 rounded-xl">
          <option value="">Nessun livello</option>
          {FUNNEL_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>

        <h4 className="font-bold mt-4">Notifica interna</h4>
        <input type="email" value={data.internalNotificationEmail || ""} onChange={e => setData({...data, internalNotificationEmail: e.target.value})} className="w-full p-3 border-2 rounded-xl" placeholder="email per notifica interna" />
      </div>
    </div>
  );
}
