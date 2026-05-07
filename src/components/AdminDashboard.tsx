import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Image as ImageIcon, Layout, Settings, CheckCircle2, AlertCircle,
  Trash2, Plus, Calendar, Users, BarChart3, HelpCircle, ChevronRight,
  ExternalLink, Clock, Grid3x3
} from "lucide-react";
import type { LandingSettings, Question } from "../types";
import { cn } from "../lib/utils";
import * as firebaseService from "../lib/firebaseService";
import PageBuilder from "./PageBuilder";

type Tab = "customize" | "questions" | "slots" | "bookings" | "stats" | "pageBuilder";

export default function AdminDashboard({ setIsAuthenticated }: { setIsAuthenticated: (val: boolean) => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("customize");
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [slotForm, setSlotForm] = useState({ date: "", time: "09:00", capacity: 4 });
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editForm, setEditForm] = useState<Question | null>(null);

  useEffect(() => {
    refreshAllData();
  }, [activeTab]);

  const refreshAllData = async () => {
    try {
      const settingsData = await firebaseService.getSettings();
      const questionsData = await firebaseService.getQuestions();
      const slotsData = await firebaseService.getSlots();
      const bookingsData = await firebaseService.getBookings();
      const statsData = await firebaseService.getStats();

      setSettings(settingsData || {
        hero_title: "TOTAL LIFT",
        hero_subtitle: "Total Beauty Day",
        hero_date: "",
        hero_description: "",
        cta_text: "",
        hero_image: "",
        selected_images: [],
        image_urls: {}
      });
      setQuestions(questionsData);
      setSlots(slotsData);
      setBookings(bookingsData);
      setStats(statsData);
      setAvailableImages(["hero.jpg", "before-after-1.jpg", "before-after-2.jpg", "before-after-3.jpg", "studio.jpg", "procedure.jpg"]);
    } catch (e) {
      console.error("Errore Firebase:", e);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await firebaseService.saveSettings(settings);
      setSaveStatus("success");
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const addQuestion = async () => {
    await firebaseService.addQuestion({ text: "Nuova Domanda", options: ["Opzione 1", "Opzione 2"], type: "single" });
    refreshAllData();
  };

  const deleteQuestion = async (id: any) => {
    if (!confirm("Eliminare questa domanda?")) return;
    await firebaseService.deleteQuestion(id);
    refreshAllData();
  };

  const openEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setEditForm({...q});
  };

  const saveQuestion = async () => {
    if (!editForm) return;
    try {
      await firebaseService.updateQuestion(editForm.id, editForm);
      setSaveStatus("success");
      setEditingQuestion(null);
      setEditForm(null);
      refreshAllData();
    } catch {
      setSaveStatus("error");
    }
    setTimeout(() => setSaveStatus("idle"), 3000);
  };

  const addOption = () => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      options: [...(editForm.options || []), "Nuova opzione"]
    });
  };

  const updateOption = (idx: number, value: string) => {
    if (!editForm) return;
    const newOptions = [...(editForm.options || [])];
    newOptions[idx] = value;
    setEditForm({...editForm, options: newOptions});
  };

  const removeOption = (idx: number) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      options: editForm.options.filter((_, i) => i !== idx)
    });
  };

  const setCascata = (parentQuestionId: string, parentAnswer: string) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      cascata: {
        domanda_id: parentQuestionId,
        risposta: parentAnswer
      }
    });
  };

  const removeCascata = () => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      cascata: null
    });
  };

  const createSlot = async () => {
    if (!slotForm.date) return alert("Scegli una data");
    await firebaseService.addSlot(slotForm);
    setSlotForm({ date: "", time: "09:00", capacity: 4 });
    refreshAllData();
  };

  const deleteSlot = async (id: string) => {
    if (!confirm("Eliminare questo slot?")) return;
    await firebaseService.deleteSlot(id);
    refreshAllData();
  };

  const toggleImageSelection = (img: string) => {
    if (!settings) return;
    const isSelected = settings.selected_images.includes(img);
    setSettings({
      ...settings,
      selected_images: isSelected
        ? settings.selected_images.filter(i => i !== img)
        : [...settings.selected_images, img]
    });
  };

  if (!settings) return <div className="p-8 text-center font-bold text-gray-500">Caricamento...</div>;

  // Se activeTab è pageBuilder, renderizza solo il PageBuilder
  if (activeTab === "pageBuilder") {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <button
          onClick={() => setActiveTab("customize")}
          className="absolute top-4 left-4 z-50 px-4 py-2 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2"
        >
          <ChevronRight size={16} className="rotate-180" /> Torna al Dashboard
        </button>
        <PageBuilder />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f8fa] flex flex-col md:flex-row pb-32 md:pb-0">
      <aside className="w-full md:w-64 bg-gradient-to-b from-[#0066A1] to-[#004d7a] text-white flex flex-col shadow-2xl shrink-0 z-30">
        <div className="p-8 border-b border-white/10">
          <h2 className="text-xl font-black tracking-tighter flex items-center gap-2">
            <Layout size={24} /> RICCIARDI
          </h2>
          <p className="text-[10px] opacity-60 font-black uppercase tracking-widest mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          {[
            { id: "customize" as Tab, label: "Personalizza Landing", icon: Layout },
            { id: "pageBuilder" as Tab, label: "Page Builder", icon: Grid3x3 },
            { id: "questions" as Tab, label: "Gestisci Domande", icon: HelpCircle },
            { id: "slots" as Tab, label: "Gestisci Slot", icon: Calendar },
            { id: "bookings" as Tab, label: "Prenotazioni", icon: Users },
            { id: "stats" as Tab, label: "Statistiche", icon: BarChart3 }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-xl font-bold transition-all transform hover:translate-x-1",
                activeTab === item.id
                  ? "bg-white/20 text-white shadow-lg border-l-4 border-[#96C8E6]"
                  : "hover:bg-white/5 text-white/70"
              )}
            >
              <item.icon size={20} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-white/10 space-y-3">
          
            href="/"
            target="_blank"
            className="flex items-center justify-center gap-2 w-full py-3 bg-white/10 rounded-xl text-xs font-bold hover:bg-white/20 transition-all"
          >
            Visualizza Landing <ExternalLink size={14} />
          </a>
          <button
            onClick={() => {
              localStorage.removeItem("adminAuthenticated");
              setIsAuthenticated(false);
              window.location.href = "/admin";
            }}
            className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 rounded-xl text-xs font-bold hover:bg-red-700 transition-all"
          >
            Logout <ChevronRight size={14} />
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-10">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Admin Dashboard</h1>
              <p className="text-gray-500 font-medium">Studio Dentistico Ricciardi</p>
            </div>
            <a href="/" className="bg-[#0066A1] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#004d7a] transition-all flex items-center gap-2 shadow-lg text-sm">
              <ExternalLink size={16} /> Visualizza Landing
            </a>
          </header>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-[#0066A1] hover:shadow-md transition-all">
                <div className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Prenotazioni</div>
                <div className="text-3xl font-black text-[#0066A1]">{stats.total_bookings}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-green-500 hover:shadow-md transition-all">
                <div className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Pagate</div>
                <div className="text-3xl font-black text-green-600">{stats.paid_bookings}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-400 hover:shadow-md transition-all">
                <div className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">In Sospeso</div>
                <div className="text-3xl font-black text-blue-600">{stats.pending_bookings || 0}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-purple-500 hover:shadow-md transition-all">
                <div className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Slot Liberi</div>
                <div className="text-3xl font-black text-purple-600">{stats.available_slots || 0}</div>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* TAB: CUSTOMIZE */}
            {activeTab === "customize" && (
              <motion.div key="customize" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                <div className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
                  <h2 className="text-2xl font-black text-[#0066A1]">⚙️ Configurazione Hero</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-bold text-gray-700 mb-2">Titolo</label>
                      <input type="text" value={settings.hero_title} onChange={(e) => setSettings({...settings, hero_title: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3 font-bold" />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-2">Sottotitolo</label>
                      <input type="text" value={settings.hero_subtitle} onChange={(e) => setSettings({...settings, hero_subtitle: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3 font-bold" />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-2">Data</label>
                      <input type="text" value={settings.hero_date} onChange={(e) => setSettings({...settings, hero_date: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3 font-bold" />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-2">CTA Text</label>
                      <input type="text" value={settings.cta_text} onChange={(e) => setSettings({...settings, cta_text: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3 font-bold" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-bold text-gray-700 mb-2">Descrizione</label>
                      <textarea value={settings.hero_description} onChange={(e) => setSettings({...settings, hero_description: e.target.value})} rows={4} className="w-full border border-gray-300 rounded-lg p-3 font-bold" />
                    </div>
                  </div>
                  <button onClick={handleSaveSettings} disabled={isSaving} className="w-full bg-[#0066A1] text-white py-4 rounded-xl font-black hover:bg-[#004d7a] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSaving ? "Salvataggio..." : <><Save size={20} /> Salva Impostazioni</>}
                  </button>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
                  <h2 className="text-2xl font-black text-[#0066A1]">🖼️ Galleria Immagini</h2>
                  <div className="space-y-4">
                    {availableImages.map((img) => (
                      <div key={img} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <input type="checkbox" checked={settings.selected_images.includes(img)} onChange={() => toggleImageSelection(img)} className="w-6 h-6 rounded cursor-pointer" />
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{img}</p>
                          <p className="text-xs text-gray-500">Immagine</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleSaveSettings} disabled={isSaving} className="w-full bg-[#0066A1] text-white py-4 rounded-xl font-black hover:bg-[#004d7a] transition-all">
                    {isSaving ? "Salvataggio..." : "Salva Galleria"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* TAB: QUESTIONS */}
            {activeTab === "questions" && (
              <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-[#0066A1]">❓ Gestisci Domande</h2>
                  <button onClick={addQuestion} className="flex items-center gap-2 bg-[#0066A1] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#004d7a] transition-all">
                    <Plus size={20} /> Nuova Domanda
                  </button>
                </div>

                <div className="space-y-4">
                  {questions.map((q) => (
                    <div key={q.id} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all cursor-pointer hover:border-[#0066A1]" onClick={() => openEditQuestion(q)}>
                      <h3 className="font-black text-gray-900 text-lg">{q.text}</h3>
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {q.options.map((opt, idx) => (
                          <span key={idx} className="text-xs bg-[#E8F4F8] text-[#0066A1] px-3 py-1 rounded-full font-bold">{opt}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <AnimatePresence>
                  {editingQuestion && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 space-y-6 max-h-96 overflow-y-auto">
                        <h3 className="text-2xl font-black text-gray-900">Modifica Domanda</h3>
                        <div>
                          <label className="block font-bold text-gray-700 mb-2">Testo Domanda</label>
                          <input type="text" value={editForm?.text || ""} onChange={(e) => setEditForm({...editForm!, text: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3 font-bold" />
                        </div>

                        <div>
                          <label className="block font-bold text-gray-700 mb-2">Opzioni</label>
                          <div className="space-y-2">
                            {editForm?.options.map((opt, idx) => (
                              <div key={idx} className="flex gap-2">
                                <input type="text" value={opt} onChange={(e) => updateOption(idx, e.target.value)} className="flex-1 border border-gray-300 rounded-lg p-2 font-bold" />
                                <button onClick={() => removeOption(idx)} className="p-2 text-red-600 hover:bg-red-50 rounded transition-all">
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button onClick={addOption} className="mt-3 flex items-center gap-2 text-[#0066A1] font-bold hover:text-[#004d7a]">
                            <Plus size={18} /> Aggiungi Opzione
                          </button>
                        </div>

                        <div className="flex gap-3">
                          <button onClick={saveQuestion} className="flex-1 bg-[#0066A1] text-white py-3 rounded-xl font-black hover:bg-[#004d7a] transition-all">
                            Salva
                          </button>
                          <button onClick={() => { setEditingQuestion(null); deleteQuestion(editingQuestion.id); }} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black hover:bg-red-700 transition-all">
                            Elimina
                          </button>
                          <button onClick={() => setEditingQuestion(null)} className="flex-1 bg-gray-300 text-gray-900 py-3 rounded-xl font-black hover:bg-gray-400 transition-all">
                            Annulla
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* TAB: SLOTS */}
            {activeTab === "slots" && (
              <motion.div key="slots" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="text-2xl font-black text-[#0066A1]">📅 Gestisci Slot</h2>

                <div className="bg-white p-8 rounded-2xl shadow-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 mb-2">Data</label>
                      <input type="date" value={slotForm.date} onChange={(e) => setSlotForm({...slotForm, date: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3 font-bold" />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-2">Ora</label>
                      <input type="time" value={slotForm.time} onChange={(e) => setSlotForm({...slotForm, time: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3 font-bold" />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-2">Capienza</label>
                      <input type="number" value={slotForm.capacity} onChange={(e) => setSlotForm({...slotForm, capacity: parseInt(e.target.value)})} className="w-full border border-gray-300 rounded-lg p-3 font-bold" />
                    </div>
                  </div>
                  <button onClick={createSlot} className="w-full bg-[#0066A1] text-white py-3 rounded-xl font-black hover:bg-[#004d7a] transition-all flex items-center justify-center gap-2">
                    <Plus size={20} /> Crea Slot
                  </button>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
                  <h3 className="font-black text-xl text-gray-900">Slot Creati</h3>
                  {Object.entries(slots.reduce((acc: any, s: any) => { acc[s.date] = [...(acc[s.date] || []), s]; return acc; }, {}))
                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                    .map(([date, dateSlots]: any) => (
                      <div key={date}>
                        <h4 className="text-lg font-bold text-[#0066A1] mb-3">{date}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {dateSlots.map((s: any) => (
                            <div key={s.id} className="bg-[#E8F4F8] p-3 rounded-lg flex flex-col items-center justify-center">
                              <div className="font-bold text-[#0066A1]">{s.time}</div>
                              <div className="text-xs text-gray-600">{s.capacity} posti</div>
                              <button onClick={() => deleteSlot(s.id)} className="mt-2 text-red-600 hover:bg-red-50 p-1 rounded transition-all">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}

            {/* TAB: BOOKINGS */}
            {activeTab === "bookings" && (
              <motion.div key="bookings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="text-2xl font-black text-[#0066A1]">📋 Prenotazioni</h2>
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#0066A1] text-white">
                      <tr>
                        <th className="p-4 text-left font-bold">Nome</th>
                        <th className="p-4 text-left font-bold">Email</th>
                        <th className="p-4 text-left font-bold">Data</th>
                        <th className="p-4 text-left font-bold">Ora</th>
                        <th className="p-4 text-left font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {bookings.map((b, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-4 font-bold text-gray-900">{b.name}</td>
                          <td className="p-4 text-gray-600">{b.email}</td>
                          <td className="p-4 text-gray-600">{b.date}</td>
                          <td className="p-4 text-gray-600">{b.time}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${b.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                              {b.payment_status === "paid" ? "✓ Pagata" : "⏳ In sospeso"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* TAB: STATS */}
            {activeTab === "stats" && (
              <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="text-2xl font-black text-[#0066A1]">📊 Statistiche</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
                    <div className="text-gray-400 font-bold text-sm mb-2">TASSO CONVERSIONE</div>
                    <div className="text-5xl font-black text-[#0066A1]">{stats?.conversion_rate || "0"}%</div>
                  </div>
                  <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
                    <div className="text-gray-400 font-bold text-sm mb-2">TEMPO MEDIO</div>
                    <div className="text-5xl font-black text-green-600">{stats?.avg_time || "0"}m</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {saveStatus === "success" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg">
              <CheckCircle2 size={20} /> Salvataggio completato!
            </motion.div>
          )}

          {saveStatus === "error" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 right-6 bg-red-500 text-white px-6 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg">
              <AlertCircle size={20} /> Errore nel salvataggio!
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
