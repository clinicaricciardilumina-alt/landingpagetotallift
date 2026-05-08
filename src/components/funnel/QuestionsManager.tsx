import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import * as funnelService from "../../lib/funnelService";
import { FUNNEL_LEVELS } from "../../types";
import type { FunnelQuestion, QuestionOption, AnswerAction, AnswerActionType, Funnel, ContactForm, ThankYouPage } from "../../types";

const QUESTION_TYPES = [
  { value: "single_choice", label: "Scelta singola" },
  { value: "multi_choice", label: "Scelta multipla" },
  { value: "yes_no", label: "Sì/No" },
  { value: "text", label: "Campo testo" },
  { value: "number", label: "Numero" },
  { value: "date", label: "Data" },
  { value: "phone", label: "Telefono" },
  { value: "email", label: "Email" },
];

const ACTION_TYPES: { value: AnswerActionType; label: string }[] = [
  { value: "next_question", label: "Vai a domanda successiva" },
  { value: "go_to_form", label: "Vai a modulo" },
  { value: "go_to_thank_you", label: "Vai a thank you" },
  { value: "show_booking", label: "Mostra prenotazione" },
  { value: "assign_tag", label: "Assegna tag" },
  { value: "assign_level", label: "Assegna livello funnel" },
  { value: "send_email", label: "Invia email automatica" },
  { value: "send_internal_notification", label: "Notifica interna" },
  { value: "stop_flow", label: "Interrompi percorso" },
  { value: "external_url", label: "Pagina esterna" },
];

export default function QuestionsManager() {
  const [questions, setQuestions] = useState<FunnelQuestion[]>([]);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [forms, setForms] = useState<ContactForm[]>([]);
  const [thankYous, setThankYous] = useState<ThankYouPage[]>([]);
  const [editing, setEditing] = useState<FunnelQuestion | null>(null);
  const [filterFunnel, setFilterFunnel] = useState<string>("");

  const refresh = async () => {
    setQuestions(await funnelService.getFunnelQuestions());
    setFunnels(await funnelService.getFunnels());
    setForms(await funnelService.getContactForms());
    setThankYous(await funnelService.getThankYouPages());
  };

  useEffect(() => { refresh(); }, []);

  const create = async () => {
    const now = new Date().toISOString();
    const q: Omit<FunnelQuestion, "id"> = {
      text: "Nuova domanda",
      type: "single_choice",
      options: [
        { id: `opt_${Date.now()}_1`, label: "Opzione 1", value: "opt1", actions: [] },
        { id: `opt_${Date.now()}_2`, label: "Opzione 2", value: "opt2", actions: [] },
      ],
      order: questions.length + 1,
      required: true,
      createdAt: now,
      funnelId: filterFunnel || undefined,
    };
    const created = await funnelService.addFunnelQuestion(q);
    refresh();
    setEditing(created);
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminare questa domanda?")) return;
    await funnelService.deleteFunnelQuestion(id);
    refresh();
  };

  const filtered = filterFunnel
    ? questions.filter(q => q.funnelId === filterFunnel)
    : questions;

  if (editing) {
    return (
      <QuestionEditor
        question={editing}
        questions={questions}
        funnels={funnels}
        forms={forms}
        thankYous={thankYous}
        onClose={() => { setEditing(null); refresh(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Domande e logiche</h2>
          <p className="text-gray-500 text-sm">Crea domande con risposte e azioni condizionali</p>
        </div>
        <button onClick={create} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2">
          <Plus size={18} /> Nuova Domanda
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl flex items-center gap-3">
        <label className="text-sm font-bold">Filtra per funnel:</label>
        <select value={filterFunnel} onChange={e => setFilterFunnel(e.target.value)} className="p-2 border-2 rounded-lg">
          <option value="">Tutte</option>
          {funnels.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed">
            <p className="text-gray-500">Nessuna domanda. Crea la prima.</p>
          </div>
        ) : [...filtered].sort((a, b) => a.order - b.order).map(q => (
          <div key={q.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-gray-400">#{q.order}</span>
                <h3 className="font-bold">{q.text}</h3>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded">{q.type}</span>
                {q.funnelId && <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{funnels.find(f => f.id === q.funnelId)?.name}</span>}
              </div>
              <p className="text-xs text-gray-500">{q.options.length} opzioni</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(q)} className="p-2 rounded-lg hover:bg-gray-100"><Edit2 size={18} /></button>
              <button onClick={() => remove(q.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionEditor({ question, questions, funnels, forms, thankYous, onClose }: {
  question: FunnelQuestion;
  questions: FunnelQuestion[];
  funnels: Funnel[];
  forms: ContactForm[];
  thankYous: ThankYouPage[];
  onClose: () => void;
}) {
  const [data, setData] = useState<FunnelQuestion>(question);
  const [savedMsg, setSavedMsg] = useState("");

  const save = async () => {
    await funnelService.updateFunnelQuestion(question.id, data);
    setSavedMsg("Salvato!");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const addOption = () => {
    setData(prev => ({
      ...prev,
      options: [...prev.options, { id: `opt_${Date.now()}`, label: "Nuova opzione", value: `opt${prev.options.length + 1}`, actions: [] }],
    }));
  };

  const updateOption = (idx: number, newOpt: QuestionOption) => {
    setData(prev => ({
      ...prev,
      options: prev.options.map((o, i) => i === idx ? newOpt : o),
    }));
  };

  const removeOption = (idx: number) => {
    setData(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== idx) }));
  };

  const addActionToOption = (optIdx: number) => {
    const newAction: AnswerAction = { type: "next_question" };
    setData(prev => ({
      ...prev,
      options: prev.options.map((o, i) => i === optIdx ? { ...o, actions: [...o.actions, newAction] } : o),
    }));
  };

  const updateAction = (optIdx: number, actIdx: number, newAction: AnswerAction) => {
    setData(prev => ({
      ...prev,
      options: prev.options.map((o, i) =>
        i === optIdx
          ? { ...o, actions: o.actions.map((a, j) => j === actIdx ? newAction : a) }
          : o
      ),
    }));
  };

  const removeAction = (optIdx: number, actIdx: number) => {
    setData(prev => ({
      ...prev,
      options: prev.options.map((o, i) =>
        i === optIdx ? { ...o, actions: o.actions.filter((_, j) => j !== actIdx) } : o
      ),
    }));
  };

  const otherQuestions = questions.filter(q => q.id !== question.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="px-4 py-2 border-2 rounded-xl font-bold">← Indietro</button>
          <h2 className="text-2xl font-black">Modifica Domanda</h2>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-green-600 font-bold">{savedMsg}</span>}
          <button onClick={save} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold">Salva</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl space-y-4">
        <div>
          <label className="block text-sm font-bold mb-1">Testo domanda</label>
          <input type="text" value={data.text} onChange={e => setData({...data, text: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Descrizione (opzionale)</label>
          <input type="text" value={data.description || ""} onChange={e => setData({...data, description: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">Tipo</label>
            <select value={data.type} onChange={e => setData({...data, type: e.target.value as any})} className="w-full p-3 border-2 rounded-xl">
              {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Ordine</label>
            <input type="number" value={data.order} onChange={e => setData({...data, order: parseInt(e.target.value) || 0})} className="w-full p-3 border-2 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Funnel</label>
            <select value={data.funnelId || ""} onChange={e => setData({...data, funnelId: e.target.value || undefined})} className="w-full p-3 border-2 rounded-xl">
              <option value="">Nessuno (globale)</option>
              {funnels.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={data.required} onChange={e => setData({...data, required: e.target.checked})} />
          <span className="text-sm font-bold">Obbligatoria</span>
        </label>
      </div>

      {(data.type === "single_choice" || data.type === "multi_choice" || data.type === "yes_no") && (
        <div className="bg-white p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-lg">Risposte e azioni</h3>
            <button onClick={addOption} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold text-sm flex items-center gap-1">
              <Plus size={14} /> Aggiungi risposta
            </button>
          </div>

          <div className="space-y-4">
            {data.options.map((opt, optIdx) => (
              <div key={opt.id} className="border-2 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt.label}
                    onChange={e => updateOption(optIdx, { ...opt, label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                    className="flex-1 p-2 border-2 rounded-lg"
                    placeholder="Testo risposta"
                  />
                  <button onClick={() => removeOption(optIdx)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="pl-4 border-l-4 border-blue-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-500 uppercase">Se l'utente risponde "{opt.label}":</p>
                    <button onClick={() => addActionToOption(optIdx)} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-bold">
                      + Azione
                    </button>
                  </div>

                  {opt.actions.length === 0 && (
                    <p className="text-xs text-gray-400 italic">Nessuna azione (passa alla domanda successiva per ordine)</p>
                  )}

                  {opt.actions.map((action, actIdx) => (
                    <div key={actIdx} className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={action.type}
                          onChange={e => updateAction(optIdx, actIdx, { ...action, type: e.target.value as AnswerActionType })}
                          className="flex-1 p-2 border-2 rounded-lg text-sm"
                        >
                          {ACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <button onClick={() => removeAction(optIdx, actIdx)} className="p-1 text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {action.type === "next_question" && (
                        <select
                          value={action.nextQuestionId || ""}
                          onChange={e => updateAction(optIdx, actIdx, { ...action, nextQuestionId: e.target.value })}
                          className="w-full p-2 border-2 rounded-lg text-sm"
                        >
                          <option value="">-- Seleziona domanda --</option>
                          {otherQuestions.map(q => <option key={q.id} value={q.id}>{q.text.slice(0, 60)}</option>)}
                        </select>
                      )}

                      {action.type === "go_to_form" && (
                        <select value={action.formId || ""} onChange={e => updateAction(optIdx, actIdx, { ...action, formId: e.target.value })} className="w-full p-2 border-2 rounded-lg text-sm">
                          <option value="">-- Seleziona modulo --</option>
                          {forms.map(f => <option key={f.id} value={f.id}>{f.internalName}</option>)}
                        </select>
                      )}

                      {action.type === "go_to_thank_you" && (
                        <select value={action.thankYouPageId || ""} onChange={e => updateAction(optIdx, actIdx, { ...action, thankYouPageId: e.target.value })} className="w-full p-2 border-2 rounded-lg text-sm">
                          <option value="">-- Seleziona thank you --</option>
                          {thankYous.map(t => <option key={t.id} value={t.id}>{t.internalName}</option>)}
                        </select>
                      )}

                      {action.type === "assign_tag" && (
                        <input
                          type="text"
                          placeholder="Nome tag"
                          value={action.tag || ""}
                          onChange={e => updateAction(optIdx, actIdx, { ...action, tag: e.target.value })}
                          className="w-full p-2 border-2 rounded-lg text-sm"
                        />
                      )}

                      {action.type === "assign_level" && (
                        <select value={action.funnelLevel || ""} onChange={e => updateAction(optIdx, actIdx, { ...action, funnelLevel: e.target.value as any })} className="w-full p-2 border-2 rounded-lg text-sm">
                          <option value="">-- Seleziona livello --</option>
                          {FUNNEL_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                      )}

                      {action.type === "external_url" && (
                        <input type="url" placeholder="https://..." value={action.externalUrl || ""} onChange={e => updateAction(optIdx, actIdx, { ...action, externalUrl: e.target.value })} className="w-full p-2 border-2 rounded-lg text-sm" />
                      )}

                      {action.type === "send_internal_notification" && (
                        <input type="email" placeholder="email@studio.it" value={action.notificationEmail || ""} onChange={e => updateAction(optIdx, actIdx, { ...action, notificationEmail: e.target.value })} className="w-full p-2 border-2 rounded-lg text-sm" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
