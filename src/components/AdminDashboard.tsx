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

  if (!settings) return <div className="flex items-center justify-center h-screen text-gray-500">Caricamento...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-[#0066A1] text-white p-6">
        <h2 className="text-2xl font-black mb-8">RICCIARDI</h2>
        <nav className="space-y-2">
          {[
            { id: "customize", label: "Personalizza" },
            { id: "questions", label: "Domande" },
            { id: "slots", label: "Slot" },
            { id: "bookings", label: "Prenotazioni" },
            { id: "stats", label: "Statistiche" }
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
        <div className="mt-8 space-y-2">
          <a href="/" target="_blank" className="block w-full text-center px-4 py-2 bg-white/10 rounded text-sm">👁️ Visualizza</a>
          <button onClick={() => { localStorage.removeItem("adminAuthenticated"); setIsAuthenticated(false); window.location.href = "/admin"; }} className="w-full px-4 py-2 bg-red-600 rounded text-sm">Logout</button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-black mb-6">Dashboard</h1>

        {activeTab === "customize" && (
          <div className="bg-white p-6 rounded-lg max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Personalizza Landing</h2>
            <div className="space-y-4">
              <input value={settings.hero_title} onChange={(e) => setSettings({...settings, hero_title: e.target.value})} className="w-full border p-2 rounded" placeholder="Titolo" />
              <input value={settings.hero_subtitle} onChange={(e) => setSettings({...settings, hero_subtitle: e.target.value})} className="w-full border p-2 rounded" placeholder="Sottotitolo" />
              <input value={settings.hero_date} onChange={(e) => setSettings({...settings, hero_date: e.target.value})} className="w-full border p-2 rounded" placeholder="Data" />
              <input value={settings.cta_text} onChange={(e) => setSettings({...settings, cta_text: e.target.value})} className="w-full border p-2 rounded" placeholder="CTA" />
              <textarea value={settings.hero_description} onChange={(e) => setSettings({...settings, hero_description: e.target.value})} rows={4} className="w-full border p-2 rounded" placeholder="Descrizione" />
              <button onClick={async () => { setIsSaving(true); await firebaseService.saveSettings(settings); setIsSaving(false); }} className="w-full bg-[#7CB342] text-white py-2 rounded font-bold">
                {isSaving ? "Salvataggio..." : "Salva"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "questions" && (
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Domande</h2>
            {questions.map((q) => (
              <div key={q.id} className="border p-3 mb-2 rounded">
                <div className="font-bold">{q.text}</div>
                <div className="text-sm text-gray-600">{q.options.join(", ")}</div>
              </div>
            ))}
            <button onClick={async () => { await firebaseService.addQuestion({ text: "Nuova", options: ["Opzione 1", "Opzione 2"], type: "single" }); loadData(); }} className="mt-4 bg-[#0066A1] text-white px-4 py-2 rounded">Nuova Domanda</button>
          </div>
        )}

        {activeTab === "slots" && (
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Slot</h2>
            <div className="space-y-2 mb-4">
              <input type="date" value={slotForm.date} onChange={(e) => setSlotForm({...slotForm, date: e.target.value})} className="w-full border p-2 rounded" />
              <select value={slotForm.time} onChange={(e) => setSlotForm({...slotForm, time: e.target.value})} className="w-full border p-2 rounded">
                {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map((t) => <option key={t}>{t}</option>)}
              </select>
              <button onClick={async () => { await firebaseService.addSlot(slotForm); setSlotForm({ date: "", time: "09:00" }); loadData(); }} className="w-full bg-[#0066A1] text-white py-2 rounded">Crea</button>
            </div>
            {slots.map((s, i) => (
              <div key={i} className="border p-3 mb-2 rounded flex justify-between">
                <div>{s.date} {s.time}</div>
                <button onClick={async () => { await firebaseService.deleteSlot(s.id); loadData(); }} className="text-red-600">Elimina</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Prenotazioni</h2>
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr><th className="text-left p-2">Nome</th><th className="text-left p-2">Data</th><th className="text-left p-2">Stato</th></tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b">
                    <td className="p-2">{b.name}</td>
                    <td className="p-2">{b.date}</td>
                    <td className="p-2"><span className={`px-2 py-1 rounded text-xs ${b.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{b.payment_status === "paid" ? "Pagato" : "In attesa"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Statistiche</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center"><div className="text-3xl font-black">{stats?.total_bookings || 0}</div><div className="text-sm text-gray-500">Prenotazioni</div></div>
              <div className="text-center"><div className="text-3xl font-black text-green-600">{stats?.paid_bookings || 0}</div><div className="text-sm text-gray-500">Pagate</div></div>
              <div className="text-center"><div className="text-3xl font-black">€{(stats?.paid_bookings || 0) * 67}</div><div className="text-sm text-gray-500">Incasso</div></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
