import React, { useState, useEffect } from "react";
import * as firebaseService from "../lib/firebaseService";

type Tab = "customize" | "questions" | "slots" | "bookings" | "stats";

export default function AdminDashboard({ setIsAuthenticated }: { setIsAuthenticated: (val: boolean) => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("customize");
  const [settings, setSettings] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsData, questionsData, slotsData, bookingsData, statsData] = await Promise.all([
        firebaseService.getSettings(),
        firebaseService.getQuestions(),
        firebaseService.getSlots(),
        firebaseService.getBookings(),
        firebaseService.getStats()
      ]);
      setSettings(settingsData || { hero_title: "TOTAL LIFT", hero_subtitle: "Total Beauty Day", hero_date: "", hero_description: "", cta_text: "", selected_images: [], image_urls: {} });
      setQuestions(questionsData || []);
      setSlots(slotsData || []);
      setBookings(bookingsData || []);
      setStats(statsData || { total_bookings: 0, paid_bookings: 0 });
    } catch (e) {
      console.error("Errore:", e);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await firebaseService.saveSettings(settings);
      alert("✓ Salvato!");
    } catch (e) {
      alert("❌ Errore nel salvataggio");
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings) return <div className="flex items-center justify-center h-screen text-gray-500">Caricamento...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-[#0066A1] text-white p-6 sticky top-0 h-screen">
        <h2 className="text-2xl font-black mb-8">RICCIARDI</h2>
        <nav className="space-y-2 mb-8">
          {[
            { id: "customize", label: "🎨 Personalizza" },
            { id: "questions", label: "❓ Domande" },
            { id: "slots", label: "📅 Slot" },
            { id: "bookings", label: "👥 Prenotazioni" },
            { id: "stats", label: "📈 Statistiche" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full text-left px-4 py-2 rounded ${activeTab === item.id ? "bg-white/20" : "hover:bg-white/10"}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="space-y-2">
          <a href="/" target="_blank" className="block w-full text-center px-4 py-2 bg-white/10 rounded text-sm">👁️ Visualizza</a>
          <button
            onClick={() => {
              localStorage.removeItem("adminAuthenticated");
              setIsAuthenticated(false);
              window.location.href = "/admin";
            }}
            className="w-full px-4 py-2 bg-red-600 rounded text-sm"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-black mb-6">Dashboard</h1>

        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded border-l-4 border-[#0066A1]">
              <div className="text-xs text-gray-500 font-bold">Prenotazioni</div>
              <div className="text-3xl font-black text-[#0066A1]">{stats.total_bookings}</div>
            </div>
            <div className="bg-white p-4 rounded border-l-4 border-green-500">
              <div className="text-xs text-gray-500 font-bold">Pagate</div>
              <div className="text-3xl font-black text-green-600">{stats.paid_bookings}</div>
            </div>
            <div className="bg-white p-4 rounded border-l-4 border-blue-500">
              <div className="text-xs text-gray-500 font-bold">Incasso</div>
              <div className="text-3xl font-black">€{stats.paid_bookings * 67}</div>
            </div>
            <div className="bg-white p-4 rounded border-l-4 border-orange-500">
              <div className="text-xs text-gray-500 font-bold">Conversion</div>
              <div className="text-3xl font-black">{stats.total_bookings > 0 ? Math.round((stats.paid_bookings / stats.total_bookings) * 100) : 0}%</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg p-8">
          {activeTab === "customize" && (
            <div className="max-w-2xl space-y-4">
              <h2 className="text-xl font-bold">Personalizza Landing</h2>
              <input value={settings.hero_title} onChange={(e) => setSettings({...settings, hero_title: e.target.value})} className="w-full border p-2 rounded" placeholder="Titolo" />
              <input value={settings.hero_subtitle} onChange={(e) => setSettings({...settings, hero_subtitle: e.target.value})} className="w-full border p-2 rounded" placeholder="Sottotitolo" />
              <input value={settings.hero_date} onChange={(e) => setSettings({...settings, hero_date: e.target.value})} className="w-full border p-2 rounded" placeholder="Data" />
              <input value={settings.cta_text} onChange={(e) => setSettings({...settings, cta_text: e.target.value})} className="w-full border p-2 rounded" placeholder="CTA" />
              <textarea value={settings.hero_description} onChange={(e) => setSettings({...settings, hero_description: e.target.value})} rows={4} className="w-full border p-2 rounded" placeholder="Descrizione" />
              <button onClick={saveSettings} disabled={isSaving} className="w-full bg-[#7CB342] text-white py-2 rounded font-bold">
                {isSaving ? "Salvataggio..." : "✓ Salva"}
              </button>
            </div>
          )}

          {activeTab === "questions" && (
            <div className="max-w-4xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Domande</h2>
                <button onClick={() => {
                  const newQ = { text: "Nuova Domanda", type: "single", options: ["Opzione 1", "Opzione 2"], cascata: null };
                  firebaseService.addQuestion(newQ).then(() => loadData());
                }} className="bg-[#0066A1] text-white px-4 py-2 rounded text-sm font-bold">+ Nuova</button>
              </div>

              {questions.map((q) => <QuestionEditor key={q.id} q={q} questions={questions} loadData={loadData} />)}
            </div>
          )}

          {activeTab === "slots" && (
            <div className="max-w-4xl">
              <h2 className="text-xl font-bold mb-6">Gestione Slot</h2>

              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-6">
                <h3 className="font-bold text-lg mb-4">Genera Slot Automaticamente</h3>
                <SlotGenerator onGenerate={() => loadData()} />
              </div>

              <div>
                <h3 className="font-bold text-lg mb-4">Slot Esistenti</h3>
                {slots.length === 0 ? (
                  <p className="text-gray-500">Nessuno slot generato</p>
                ) : (
                  <div className="space-y-2">
                    {slots.map((s) => (
                      <div key={s.id} className={`border p-4 rounded flex justify-between items-center ${s.isBlocked ? "bg-red-50 border-red-300" : "bg-green-50 border-green-300"}`}>
                        <div>
                          <div className="font-bold">{s.date}</div>
                          <div className="text-sm text-gray-600">{s.time} ({s.duration} min)</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => firebaseService.toggleSlotStatus(s.id, !s.isBlocked).then(() => loadData())}
                            className={`px-4 py-2 rounded text-sm font-bold ${s.isBlocked ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}
                          >
                            {s.isBlocked ? "🔓 Attiva" : "🔒 Blocca"}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Eliminare slot?")) {
                                firebaseService.deleteSlot(s.id).then(() => loadData());
                              }
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-bold"
                          >
                            ✕ Elimina
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "bookings" && (
            <div className="max-w-4xl">
              <h2 className="text-xl font-bold mb-4">Prenotazioni</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b font-bold">
                    <tr>
                      <th className="text-left p-2">Nome</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Data</th>
                      <th className="text-left p-2">Stato</th>
                      <th className="text-left p-2">Risposte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-bold">{b.name}</td>
                        <td className="p-2 text-gray-600">{b.email}</td>
                        <td className="p-2">{b.date} {b.time}</td>
                        <td className="p-2"><span className={`px-2 py-1 rounded text-xs font-bold ${b.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{b.payment_status === "paid" ? "Pagato" : "In attesa"}</span></td>
                        <td className="p-2 text-xs max-w-xs overflow-auto">{JSON.stringify(b.answers || {}).substring(0, 50)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "stats" && (
            <div className="max-w-2xl">
              <h2 className="text-xl font-bold mb-4">Statistiche</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center"><div className="text-3xl font-black">{stats?.total_bookings || 0}</div><div className="text-sm text-gray-500">Prenotazioni</div></div>
                <div className="text-center"><div className="text-3xl font-black text-green-600">{stats?.paid_bookings || 0}</div><div className="text-sm text-gray-500">Pagate</div></div>
                <div className="text-center"><div className="text-3xl font-black">€{(stats?.paid_bookings || 0) * 67}</div><div className="text-sm text-gray-500">Incasso</div></div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function QuestionEditor({ q, questions, loadData }: any) {
  const [editText, setEditText] = useState(q.text);
  const [editType, setEditType] = useState(q.type);
  const [editOptions, setEditOptions] = useState(q.options || []);

  const saveQuestion = async () => {
    const updated = {...q, text: editText, type: editType, options: editOptions};
    await firebaseService.updateQuestion(q.id, updated);
    loadData();
  };

  return (
    <details className="border rounded-lg mb-3">
      <summary className="p-4 cursor-pointer bg-gray-50 font-bold hover:bg-gray-100">
        {editText} <span className="text-xs text-gray-500 ml-2">({editType})</span>
      </summary>

      <div className="p-4 border-t space-y-4">
        <div>
          <label className="block text-sm font-bold mb-1">Domanda</label>
          <input
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full border p-2 rounded text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Tipo</label>
          <select
            value={editType}
            onChange={(e) => setEditType(e.target.value)}
            className="w-full border p-2 rounded text-sm"
          >
            <option value="single">Scelta Singola</option>
            <option value="multiple">Scelta Multipla</option>
            <option value="text">Risposta Aperta</option>
          </select>
        </div>

        {editType !== "text" && (
          <div>
            <label className="block text-sm font-bold mb-2">Opzioni</label>
            <div className="space-y-2">
              {editOptions.map((opt: string, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <input
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...editOptions];
                      newOpts[idx] = e.target.value;
                      setEditOptions(newOpts);
                    }}
                    className="flex-1 border p-2 rounded text-sm"
                    placeholder="Opzione"
                  />
                  <button
                    onClick={() => {
                      const newOpts = editOptions.filter((_: string, i: number) => i !== idx);
                      setEditOptions(newOpts);
                    }}
                    className="text-red-600 text-sm px-3 py-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setEditOptions([...editOptions, "Nuova opzione"])}
              className="mt-2 text-sm text-[#0066A1] font-bold"
            >
              + Aggiungi Opzione
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold mb-1">Cascata</label>
          <div className="flex gap-2 text-sm">
            <select value={q.cascata?.domanda_id || ""} onChange={(e) => {
              const cascata = e.target.value ? {...(q.cascata || {}), domanda_id: e.target.value} : null;
              const updated = {...q, cascata};
              firebaseService.updateQuestion(q.id, updated);
            }} className="flex-1 border p-2 rounded">
              <option value="">Nessuna cascata</option>
              {questions.filter((qf) => qf.id !== q.id).map((qf) => (
                <option key={qf.id} value={qf.id}>{qf.text}</option>
              ))}
            </select>
            {q.cascata && (
              <select value={q.cascata?.risposta || ""} onChange={(e) => {
                const cascata = {...q.cascata, risposta: e.target.value};
                const updated = {...q, cascata};
                firebaseService.updateQuestion(q.id, updated);
              }} className="flex-1 border p-2 rounded">
                <option value="">Scegli risposta</option>
                {questions.find((qf) => qf.id === q.cascata?.domanda_id)?.options?.map((opt: string, idx: number) => (
                  <option key={idx} value={opt}>{opt}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={saveQuestion}
            className="flex-1 bg-green-600 text-white py-2 rounded text-sm font-bold"
          >
            ✓ Salva
          </button>
          <button
            onClick={() => {
              if (confirm("Eliminare?")) {
                firebaseService.deleteQuestion(q.id).then(() => loadData());
              }
            }}
            className="flex-1 bg-red-600 text-white py-2 rounded text-sm font-bold"
          >
            🗑️ Elimina
          </button>
        </div>
      </div>
    </details>
  );
}

function SlotGenerator({ onGenerate }: any) {
  const [dates, setDates] = useState<string[]>([]);
  const [dateInput, setDateInput] = useState("");
  const [morningStart, setMorningStart] = useState("09:00");
  const [morningEnd, setMorningEnd] = useState("12:30");
  const [afternoonStart, setAfternoonStart] = useState("14:00");
  const [afternoonEnd, setAfternoonEnd] = useState("17:30");
  const [duration, setDuration] = useState("30");
  const [pause, setPause] = useState("10");
  const [generating, setGenerating] = useState(false);

  const addDate = () => {
    if (dateInput && !dates.includes(dateInput)) {
      setDates([...dates, dateInput]);
      setDateInput("");
    }
  };

  const removeDate = (date: string) => {
    setDates(dates.filter(d => d !== date));
  };

  const handleGenerate = async () => {
    if (dates.length === 0) {
      alert("Aggiungi almeno una data");
      return;
    }

    setGenerating(true);
    try {
      await firebaseService.generateSlots({
        dates,
        morningStart,
        morningEnd,
        afternoonStart,
        afternoonEnd,
        duration: parseInt(duration),
        pause: parseInt(pause),
        isBlocked: false
      });
      alert("✓ Slot generati!");
      setDates([]);
      onGenerate();
    } catch (e) {
      alert("❌ Errore");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-bold mb-2">Date</label>
        <div className="flex gap-2 mb-2">
          <input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} className="flex-1 border p-2 rounded text-sm" />
          <button onClick={addDate} className="bg-[#0066A1] text-white px-4 py-2 rounded text-sm font-bold">+ Aggiungi</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {dates.map(d => (
            <span key={d} className="bg-[#0066A1] text-white px-3 py-1 rounded text-sm flex items-center gap-2">
              {d}
              <button onClick={() => removeDate(d)} className="font-bold">✕</button>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold mb-1">Mattina Inizio</label>
          <input type="time" value={morningStart} onChange={(e) => setMorningStart(e.target.value)} className="w-full border p-2 rounded text-sm" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Mattina Fine</label>
          <input type="time" value={morningEnd} onChange={(e) => setMorningEnd(e.target.value)} className="w-full border p-2 rounded text-sm" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Pomeriggio Inizio</label>
          <input type="time" value={afternoonStart} onChange={(e) => setAfternoonStart(e.target.value)} className="w-full border p-2 rounded text-sm" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Pomeriggio Fine</label>
          <input type="time" value={afternoonEnd} onChange={(e) => setAfternoonEnd(e.target.value)} className="w-full border p-2 rounded text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold mb-1">Durata Slot (min)</label>
          <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full border p-2 rounded text-sm">
            <option value="20">20 minuti</option>
            <option value="30">30 minuti</option>
            <option value="45">45 minuti</option>
            <option value="60">60 minuti</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Pausa Tra Slot (min)</label>
          <input type="number" value={pause} onChange={(e) => setPause(e.target.value)} className="w-full border p-2 rounded text-sm" />
        </div>
      </div>

      <button onClick={handleGenerate} disabled={generating} className="w-full bg-green-600 text-white py-3 rounded font-bold">
        {generating ? "Generazione..." : "✓ Genera Slot"}
      </button>
    </div>
  );
}
