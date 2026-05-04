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
  const [slotForm, setSlotForm] = useState({ date: "", time: "09:00" });

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

  const addQuestion = async () => {
    try {
      await firebaseService.addQuestion({ text: "Nuova Domanda", options: ["Opzione 1", "Opzione 2"], type: "single" });
      loadData();
    } catch (e) {
      alert("Errore nell'aggiunta della domanda");
    }
  };

  const deleteQuestion = async (id: string) => {
    if (confirm("Eliminare?")) {
      try {
        await firebaseService.deleteQuestion(id);
        loadData();
      } catch (e) {
        alert("Errore");
      }
    }
  };

  const addSlot = async () => {
    if (!slotForm.date) {
      alert("Scegli una data");
      return;
    }
    try {
      await firebaseService.addSlot(slotForm);
      setSlotForm({ date: "", time: "09:00" });
      loadData();
    } catch (e) {
      alert("Errore");
    }
  };

  const deleteSlot = async (id: string) => {
    if (confirm("Eliminare?")) {
      try {
        await firebaseService.deleteSlot(id);
        loadData();
      } catch (e) {
        alert("Errore");
      }
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
            <div className="max-w-3xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Domande</h2>
                <button onClick={addQuestion} className="bg-[#0066A1] text-white px-4 py-2 rounded text-sm font-bold">+ Nuova</button>
              </div>
              {questions.map((q) => (
                <div key={q.id} className="border p-4 mb-2 rounded flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-bold">{q.text}</div>
                    <div className="text-sm text-gray-600">{q.options.join(", ")}</div>
                  </div>
                  <button onClick={() => deleteQuestion(q.id)} className="text-red-600 text-sm">Elimina</button>
                </div>
              ))}
            </div>
          )}

          {activeTab === "slots" && (
            <div className="max-w-3xl">
              <h2 className="text-xl font-bold mb-4">Slot</h2>
              <div className="border p-4 mb-4 rounded bg-gray-50">
                <input type="date" value={slotForm.date} onChange={(e) => setSlotForm({...slotForm, date: e.target.value})} className="w-full border p-2 rounded mb-2" />
                <select value={slotForm.time} onChange={(e) => setSlotForm({...slotForm, time: e.target.value})} className="w-full border p-2 rounded mb-2">
                  {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map((t) => <option key={t}>{t}</option>)}
                </select>
                <button onClick={addSlot} className="w-full bg-[#0066A1] text-white py-2 rounded font-bold">Crea Slot</button>
              </div>
              {slots.map((s) => (
                <div key={s.id} className="border p-3 mb-2 rounded flex justify-between">
                  <div><div className="font-bold">{s.date}</div><div className="text-sm text-gray-600">{s.time}</div></div>
                  <button onClick={() => deleteSlot(s.id)} className="text-red-600 text-sm">Elimina</button>
                </div>
              ))}
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
