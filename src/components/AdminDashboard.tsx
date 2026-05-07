import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout, HelpCircle, Calendar, Users, BarChart3, ExternalLink, Trash2, Plus } from "lucide-react";
import * as firebaseService from "../lib/firebaseService";

type Tab = "customize" | "questions" | "slots" | "bookings" | "stats";

export default function AdminDashboard({ setIsAuthenticated }: { setIsAuthenticated: (val: boolean) => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("customize");
  const [settings, setSettings] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [availableImages] = useState<string[]>(["hero.jpg", "before-after-1.jpg", "before-after-2.jpg", "before-after-3.jpg", "studio.jpg", "procedure.jpg"]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [slotForm, setSlotForm] = useState({ date: "", time: "09:00", capacity: 4 });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [settingsData, questionsData, slotsData, bookingsData, statsData] = await Promise.all([
        firebaseService.getSettings(),
        firebaseService.getQuestions(),
        firebaseService.getSlots(),
        firebaseService.getBookings(),
        firebaseService.getStats()
      ]);

      setSettings(settingsData || {
        hero_title: "TOTAL LIFT",
        hero_subtitle: "Total Beauty Day",
        hero_date: "",
        hero_description: "",
        cta_text: "",
        selected_images: [],
        image_urls: {}
      });

      setQuestions(questionsData || []);
      setSlots(slotsData || []);
      setBookings(bookingsData || []);
      setStats(statsData || { total_bookings: 0, paid_bookings: 0 });
    } catch (e) {
      console.error("Errore caricamento:", e);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await firebaseService.saveSettings(settings);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) {
      console.error(e);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const addQuestion = async () => {
    await firebaseService.addQuestion({ text: "Nuova Domanda", options: ["Opzione 1", "Opzione 2"], type: "single" });
    loadAllData();
  };

  const deleteQuestion = async (id: any) => {
    if (confirm("Eliminare questa domanda?")) {
      await firebaseService.deleteQuestion(id);
      loadAllData();
    }
  };

  const createSlot = async () => {
    if (!slotForm.date) {
      alert("Scegli una data");
      return;
    }
    await firebaseService.addSlot(slotForm);
    setSlotForm({ date: "", time: "09:00", capacity: 4 });
    loadAllData();
  };

  const deleteSlot = async (id: string) => {
    if (confirm("Eliminare questo slot?")) {
      await firebaseService.deleteSlot(id);
      loadAllData();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    setIsAuthenticated(false);
    window.location.href = "/admin";
  };

  if (!settings) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold">Caricamento...</div>;

  return (
    <div className="min-h-screen bg-[#f5f8fa] flex flex-col md:flex-row pb-32 md:pb-0">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gradient-to-b from-[#0066A1] to-[#004d7a] text-white p-6 md:min-h-screen md:sticky md:top-0">
        <div className="mb-8">
          <h2 className="text-2xl font-black">RICCIARDI</h2>
          <p className="text-xs text-white/60 mt-1">Admin Panel</p>
        </div>

        <nav className="space-y-3 mb-8">
          {[
            { id: "customize" as Tab, label: "🎨 Personalizza" },
            { id: "questions" as Tab, label: "❓ Domande" },
            { id: "slots" as Tab, label: "📅 Slot" },
            { id: "bookings" as Tab, label: "👥 Prenotazioni" },
            { id: "stats" as Tab, label: "📈 Statistiche" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left px-4 py-3 rounded-lg font-bold transition-all ${
                activeTab === item.id
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="space-y-2 pt-6 border-t border-white/20">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center px-4 py-2 bg-white/10 rounded-lg text-sm font-bold hover:bg-white/20 transition-all"
          >
            👁️ Visualizza Landing
          </a>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 rounded-lg text-sm font-bold hover:bg-red-700 transition-all"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-4xl">
          <header className="mb-8">
            <h1 className="text-4xl font-black text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Studio Ricciardi</p>
          </header>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg border-l-4 border-[#0066A1]">
                <div className="text-xs text-gray-500 font-bold">Prenotazioni</div>
                <div className="text-3xl font-black text-[#0066A1]">{stats.total_bookings}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                <div className="text-xs text-gray-500 font-bold">Pagate</div>
                <div className="text-3xl font-black text-green-600">{stats.paid_bookings}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                <div className="text-xs text-gray-500 font-bold">Incasso</div>
                <div className="text-3xl font-black text-blue-600">€{stats.paid_bookings * 67}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
                <div className="text-xs text-gray-500 font-bold">Conversion</div>
                <div className="text-3xl font-black text-orange-600">{stats.total_bookings > 0 ? Math.round((stats.paid_bookings / stats.total_bookings) * 100) : 0}%</div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="bg-white rounded-lg p-8">
            {activeTab === "customize" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-black text-[#0066A1]">Personalizza Landing</h2>

                <div>
                  <label className="block font-bold mb-2">Titolo</label>
                  <input
                    value={settings.hero_title}
                    onChange={(e) => setSettings({...settings, hero_title: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">Sottotitolo</label>
                  <input
                    value={settings.hero_subtitle}
                    onChange={(e) => setSettings({...settings, hero_subtitle: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">Data</label>
                  <input
                    value={settings.hero_date}
                    onChange={(e) => setSettings({...settings, hero_date: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">CTA</label>
                  <input
                    value={settings.cta_text}
                    onChange={(e) => setSettings({...settings, cta_text: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">Descrizione</label>
                  <textarea
                    rows={4}
                    value={settings.hero_description}
                    onChange={(e) => setSettings({...settings, hero_description: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">Immagini</label>
                  <div className="space-y-2">
                    {availableImages.map((img) => (
                      <div key={img} className="border border-gray-200 p-3 rounded-lg">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.selected_images.includes(img)}
                            onChange={(e) => {
                              const newSelected = e.target.checked
                                ? [...settings.selected_images, img]
                                : settings.selected_images.filter((i) => i !== img);
                              setSettings({...settings, selected_images: newSelected});
                            }}
                            className="w-4 h-4"
                          />
                          <span className="font-bold">{img}</span>
                        </label>
                        <input
                          type="text"
                          value={settings.image_urls[img] || `/images/${img}`}
                          onChange={(e) => setSettings({
                            ...settings,
                            image_urls: {...settings.image_urls, [img]: e.target.value}
                          })}
                          className="w-full border border-gray-200 rounded p-2 text-sm mt-2"
                          placeholder="/images/file.jpg"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={saveSettings}
                  disabled={isSaving}
                  className={`w-full py-3 rounded-lg font-bold text-white text-lg ${
                    isSaving ? "bg-gray-400" : "bg-[#7CB342] hover:bg-[#689F38]"
                  }`}
                >
                  {isSaving ? "Salvataggio..." : "✓ Salva"}
                </button>

                {saveStatus === "success" && <div className="text-green-600 font-bold text-center">✓ Salvato!</div>}
                {saveStatus === "error" && <div className="text-red-600 font-bold text-center">❌ Errore</div>}
              </div>
            )}

            {activeTab === "questions" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-[#0066A1]">Domande</h2>
                  <button
                    onClick={addQuestion}
                    className="bg-[#0066A1] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                  >
                    <Plus size={18} /> Nuova
                  </button>
                </div>

                {questions.map((q, idx) => (
                  <div key={q.id} className="border border-gray-200 p-4 rounded-lg flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-bold">{q.text}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {q.options.map((opt, i) => (
                          <span key={i} className="bg-gray-100 text-xs px-2 py-1 rounded">{opt}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteQuestion(q.id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "slots" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-black text-[#0066A1]">Slot</h2>

                <div className="border border-gray-200 p-4 rounded-lg">
                  <h3 className="font-bold mb-4">Nuovo Slot</h3>
                  <div className="space-y-4">
                    <input
                      type="date"
                      value={slotForm.date}
                      onChange={(e) => setSlotForm({...slotForm, date: e.target.value})}
                      className="w-full border border-gray-300 rounded p-2"
                    />
                    <select
                      value={slotForm.time}
                      onChange={(e) => setSlotForm({...slotForm, time: e.target.value})}
                      className="w-full border border-gray-300 rounded p-2"
                    >
                      {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={slotForm.capacity}
                      onChange={(e) => setSlotForm({...slotForm, capacity: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded p-2"
                      placeholder="Capacità"
                    />
                    <button
                      onClick={createSlot}
                      className="w-full bg-[#0066A1] text-white py-2 rounded font-bold"
                    >
                      Crea
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {slots.map((s, idx) => (
                    <div key={idx} className="border border-gray-200 p-4 rounded flex justify-between items-center">
                      <div>
                        <div className="font-bold">{s.date}</div>
                        <div className="text-sm text-gray-500">{s.time}</div>
                      </div>
                      <button
                        onClick={() => deleteSlot(s.id)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "bookings" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-black text-[#0066A1]">Prenotazioni</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b font-bold">
                        <th className="text-left p-2">Nome</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Data</th>
                        <th className="text-left p-2">Stato</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-bold">{b.name}</td>
                          <td className="p-2 text-gray-600">{b.email}</td>
                          <td className="p-2">{b.date} {b.time}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              b.payment_status === "paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}>
                              {b.payment_status === "paid" ? "Pagato" : "In attesa"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "stats" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-black text-[#0066A1]">Statistiche</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-black text-gray-900">{stats?.total_bookings || 0}</div>
                    <div className="text-xs text-gray-500">Prenotazioni</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-green-600">{stats?.paid_bookings || 0}</div>
                    <div className="text-xs text-gray-500">Pagate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-blue-600">€{(stats?.paid_bookings || 0) * 67}</div>
                    <div className="text-xs text-gray-500">Incasso</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
