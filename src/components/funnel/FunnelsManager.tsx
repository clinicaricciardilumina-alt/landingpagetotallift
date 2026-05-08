import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import * as funnelService from "../../lib/funnelService";
import { FUNNEL_LEVELS } from "../../types";
import type { Funnel, LandingPageDoc, FunnelQuestion, ContactForm, ThankYouPage } from "../../types";

export default function FunnelsManager() {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [landings, setLandings] = useState<LandingPageDoc[]>([]);
  const [forms, setForms] = useState<ContactForm[]>([]);
  const [thankYous, setThankYous] = useState<ThankYouPage[]>([]);
  const [questions, setQuestions] = useState<FunnelQuestion[]>([]);
  const [editing, setEditing] = useState<Funnel | null>(null);
  const [showNew, setShowNew] = useState(false);

  const refresh = async () => {
    setFunnels(await funnelService.getFunnels());
    setLandings(await funnelService.getLandings());
    setForms(await funnelService.getContactForms());
    setThankYous(await funnelService.getThankYouPages());
    setQuestions(await funnelService.getFunnelQuestions());
  };

  useEffect(() => { refresh(); }, []);

  const create = async (name: string) => {
    const now = new Date().toISOString();
    await funnelService.addFunnel({
      name,
      goal: "",
      initialLevel: "lead_freddo",
      bookingEnabled: false,
      defaultTags: [],
      automationIds: [],
      status: "bozza",
      createdAt: now,
      updatedAt: now,
    });
    setShowNew(false);
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminare questo funnel?")) return;
    await funnelService.deleteFunnel(id);
    refresh();
  };

  if (editing) {
    return (
      <FunnelEditor
        funnel={editing}
        landings={landings}
        forms={forms}
        thankYous={thankYous}
        questions={questions}
        onClose={() => { setEditing(null); refresh(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Funnel</h2>
          <p className="text-gray-500 text-sm">Percorsi guidati con logiche condizionali</p>
        </div>
        <button onClick={() => setShowNew(true)} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2">
          <Plus size={18} /> Nuovo Funnel
        </button>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full">
            <h3 className="text-xl font-black mb-4">Nuovo Funnel</h3>
            <input
              type="text"
              placeholder="Nome del funnel"
              autoFocus
              className="w-full p-3 border-2 rounded-xl mb-4"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (v) create(v);
                }
              }}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 border-2 rounded-xl font-bold">Annulla</button>
              <button onClick={(e) => {
                const input = (e.currentTarget.parentElement?.previousSibling as HTMLInputElement);
                if (input.value.trim()) create(input.value.trim());
              }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold">Crea</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {funnels.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed">
            <p className="text-gray-500">Nessun funnel ancora. Crea il primo per organizzare i percorsi guidati.</p>
          </div>
        ) : funnels.map(f => (
          <div key={f.id} className="bg-white p-6 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-black text-lg">{f.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  f.status === "attivo" ? "bg-green-100 text-green-700" :
                  f.status === "bozza" ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-700"
                }`}>{f.status}</span>
              </div>
              <p className="text-sm text-gray-500">
                Livello iniziale: {FUNNEL_LEVELS.find(l => l.value === f.initialLevel)?.label}
                {f.landingId && ` · Landing collegata`}
              </p>
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

function FunnelEditor({ funnel, landings, forms, thankYous, questions, onClose }: {
  funnel: Funnel; landings: LandingPageDoc[]; forms: ContactForm[];
  thankYous: ThankYouPage[]; questions: FunnelQuestion[]; onClose: () => void;
}) {
  const [data, setData] = useState<Funnel>(funnel);
  const [savedMsg, setSavedMsg] = useState("");
  const filteredQuestions = questions.filter(q => !q.funnelId || q.funnelId === funnel.id);

  const save = async () => {
    await funnelService.updateFunnel(funnel.id, data);
    setSavedMsg("Salvato!");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="px-4 py-2 border-2 rounded-xl font-bold">← Indietro</button>
          <h2 className="text-2xl font-black">Modifica Funnel: {funnel.name}</h2>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-green-600 font-bold">{savedMsg}</span>}
          <button onClick={save} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold">Salva</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">Nome</label>
            <input type="text" value={data.name} onChange={e => setData({...data, name: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Stato</label>
            <select value={data.status} onChange={e => setData({...data, status: e.target.value as any})} className="w-full p-3 border-2 rounded-xl">
              <option value="bozza">Bozza</option>
              <option value="attivo">Attivo</option>
              <option value="disattivato">Disattivato</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold mb-1">Obiettivo</label>
            <input type="text" value={data.goal} onChange={e => setData({...data, goal: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Landing collegata</label>
            <select value={data.landingId || ""} onChange={e => setData({...data, landingId: e.target.value || undefined})} className="w-full p-3 border-2 rounded-xl">
              <option value="">Nessuna</option>
              {landings.map(l => <option key={l.id} value={l.id}>{l.internalName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Livello iniziale</label>
            <select value={data.initialLevel} onChange={e => setData({...data, initialLevel: e.target.value as any})} className="w-full p-3 border-2 rounded-xl">
              {FUNNEL_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Domanda iniziale</label>
            <select value={data.startQuestionId || ""} onChange={e => setData({...data, startQuestionId: e.target.value || undefined})} className="w-full p-3 border-2 rounded-xl">
              <option value="">Nessuna</option>
              {filteredQuestions.map(q => <option key={q.id} value={q.id}>{q.text.slice(0, 50)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Modulo collegato</label>
            <select value={data.formId || ""} onChange={e => setData({...data, formId: e.target.value || undefined})} className="w-full p-3 border-2 rounded-xl">
              <option value="">Nessuno</option>
              {forms.map(f => <option key={f.id} value={f.id}>{f.internalName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Thank You Page</label>
            <select value={data.thankYouPageId || ""} onChange={e => setData({...data, thankYouPageId: e.target.value || undefined})} className="w-full p-3 border-2 rounded-xl">
              <option value="">Default</option>
              {thankYous.map(t => <option key={t.id} value={t.id}>{t.internalName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Tags di default (separati da virgola)</label>
            <input
              type="text"
              value={(data.defaultTags || []).join(", ")}
              onChange={e => setData({...data, defaultTags: e.target.value.split(",").map(s => s.trim()).filter(Boolean)})}
              className="w-full p-3 border-2 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={data.bookingEnabled} onChange={e => setData({...data, bookingEnabled: e.target.checked})} />
            <label className="text-sm font-bold">Prenotazione abilitata</label>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl">
        <h3 className="font-black mb-2">💡 Logica del funnel</h3>
        <p className="text-sm text-gray-700">
          Le logiche condizionali (cosa succede dopo ogni risposta) si configurano nella sezione <strong>Domande e logiche</strong> per ogni singola domanda. 
          Lì potrai impostare azioni come "assegna tag", "vai a modulo", "mostra prenotazione", ecc.
        </p>
      </div>
    </div>
  );
}
