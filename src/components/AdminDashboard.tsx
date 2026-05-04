import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Save, Image as ImageIcon, Layout, Settings, CheckCircle2, AlertCircle, 
  Trash2, Plus, Calendar, Users, BarChart3, HelpCircle, ChevronRight,
  ExternalLink, Clock
} from "lucide-react";
import type { LandingSettings, Question } from "../types";
import { cn } from "../lib/utils";
import * as firebaseService from "../lib/firebaseService";

type Tab = "customize" | "questions" | "slots" | "bookings" | "stats";

export default function AdminDashboard() {
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

  return (
    <div className="min-h-screen bg-[#f5f8fa] flex flex-col md:flex-row">
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

        <div className="p-6 mt-auto border-t border-white/10">
          <a 
            href="/" 
            target="_blank" 
            className="flex items-center justify-center gap-2 w-full py-3 bg-white/10 rounded-xl text-xs font-bold hover:bg-white/20 transition-all"
          >
            Visualizza Landing <ExternalLink size={14} />
          </a>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative">
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
                <div className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Incasso</div>
                <div className="text-3xl font-black text-blue-500">€{stats.paid_bookings * 67}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-orange-400 hover:shadow-md transition-all">
                <div className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Conversion</div>
                <div className="text-3xl font-black text-orange-500">{stats.total_bookings > 0 ? Math.round((stats.paid_bookings/stats.total_bookings)*100) : 0}%</div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-b pb-6">
            <div className="flex gap-4">
              {[
                { id: "customize", label: "🎨 Personalizza" },
                { id: "questions", label: "❓ Domande" },
                { id: "slots", label: "📅 Slot" },
                { id: "bookings", label: "👥 Prenotazioni" },
                { id: "stats", label: "📈 Statistiche" }
              ].map(t => (
                <button 
                  key={t.id}
                  onClick={() => setActiveTab(t.id as Tab)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                    activeTab === t.id ? "bg-[#E8F4F8] text-[#0066A1]" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {(saveStatus === "success" || saveStatus === "error") && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0 }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs shadow-lg",
                    saveStatus === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  )}
                >
                  {saveStatus === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {saveStatus === "success" ? "Salvato!" : "Errore"}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "customize" && (
              <motion.div 
                key="customize"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-10"
              >
                <div className="space-y-8">
                  <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-black text-[#0066A1] mb-6 flex items-center gap-2 uppercase tracking-widest">
                      <Layout size={20} /> Testi Hero
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Titolo</label>
                        <input 
                          value={settings.hero_title} 
                          onChange={e => setSettings({...settings, hero_title: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-bold text-gray-800 outline-none focus:ring-4 focus:ring-[#0066A1]/10"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Data</label>
                        <input 
                          value={settings.hero_date} 
                          onChange={e => setSettings({...settings, hero_date: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">CTA</label>
                        <input 
                          value={settings.cta_text} 
                          onChange={e => setSettings({...settings, cta_text: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Descrizione</label>
                        <textarea 
                          rows={4}
                          value={settings.hero_description} 
                          onChange={e => setSettings({...settings, hero_description: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-medium text-gray-600 resize-none"
                        />
                      </div>
                    </div>
                  </section>
                  
                  <button 
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="w-full bg-[#7CB342] text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-[#689F38] disabled:opacity-50"
                  >
                    {isSaving ? "Salvataggio..." : "Salva"}
                  </button>
                </div>

                <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-black text-[#0066A1] mb-6 flex items-center gap-2 uppercase">
                    <ImageIcon size={20} /> Immagini
                  </h3>
                  
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {availableImages.map(img => {
                      const imageUrls = settings.image_urls || {};
                      const currentUrl = imageUrls[img] || `/images/${img}`;

                      return (
                        <div key={img} className="border border-gray-200 rounded-lg p-3 space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.selected_images.includes(img)}
                              onChange={() => toggleImageSelection(img)}
                              className="w-4 h-4 rounded border-gray-300 text-[#0066A1]"
                            />
                            <span className="font-bold text-gray-800 text-sm">{img}</span>
                          </label>

                          <input
                            type="text"
                            value={currentUrl}
                            onChange={(e) => {
                              const newUrls = {...imageUrls, [img]: e.target.value};
                              setSettings({...settings, image_urls: newUrls});
                            }}
                            placeholder="/images/file.jpg"
                            className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs"
                          />

                          <div className="aspect-video rounded overflow-hidden bg-gray-200">
                            <img src={currentUrl} className="w-full h-full object-cover" alt={img} onError={(e) => e.currentTarget.style.display = 'none'} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === "questions" && (
              <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-[#0066A1]">Domande</h3>
                  <button onClick={addQuestion} className="flex items-center gap-2 bg-[#0066A1] text-white px-4 py-2 rounded-lg font-bold text-sm">
                    <Plus size={16} /> Nuova
                  </button>
                </div>

                {questions.map((q, idx) => (
                  <div key={q.id} className="bg-white p-6 rounded-lg border border-gray-200 flex gap-4">
                    <div className="w-8 h-8 bg-[#E8F4F8] text-[#0066A1] font-bold rounded flex items-center justify-center shrink-0">{idx + 1}</div>
                    <div className="flex-1 space-y-2">
                      <input value={q.text} className="w-full font-bold bg-transparent border-none outline-none" readOnly />
                      <div className="flex flex-wrap gap-1">
                        {q.options.map((opt, i) => (
                          <span key={i} className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">{opt}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => deleteQuestion(q.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === "slots" && (
              <motion.div key="slots" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
                    <h3 className="font-black text-[#0066A1]">Nuovo Slot</h3>
                    <input type="date" value={slotForm.date} onChange={e => setSlotForm({...slotForm, date: e.target.value})} className="w-full border border-gray-200 rounded p-2" />
                    <select value={slotForm.time} onChange={e => setSlotForm({...slotForm, time: e.target.value})} className="w-full border border-gray-200 rounded p-2">
                      {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map(t => <option key={t}>{t}</option>)}
                    </select>
                    <input type="number" value={slotForm.capacity} onChange={e => setSlotForm({...slotForm, capacity: parseInt(e.target.value)})} className="w-full border border-gray-200 rounded p-2" />
                    <button onClick={createSlot} className="w-full bg-[#0066A1] text-white py-2 rounded font-bold">Crea</button>
                  </div>
                </div>

                <div className="lg:col-span-2 grid gap-3">
                  {slots.map((s, idx) => (
                    <div key={idx} className="bg-white p-4 rounded border border-gray-200 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-[#0066A1]">{s.date}</div>
                        <div className="text-sm text-gray-500">{s.time}</div>
                      </div>
                      <button onClick={() => deleteSlot(s.id)} className="text-red-500 p-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "bookings" && (
              <motion.div key="bookings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Nome</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Stato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3"><div className="font-bold">{b.name}</div><div className="text-xs text-gray-500">{b.email}</div></td>
                        <td className="px-4 py-3"><div className="font-bold text-[#0066A1]">{b.date}</div><div className="text-xs text-gray-500">{b.time}</div></td>
                        <td className="px-4 py-3"><span className={cn("px-2 py-1 rounded text-xs font-bold", b.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700")}>{b.payment_status === "paid" ? "Pagato" : "In attesa"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}

            {activeTab === "stats" && stats && (
              <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                  <div className="text-3xl font-black text-gray-900">{stats.total_bookings}</div>
                  <div className="text-xs text-gray-500 mt-1">Prenotazioni</div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                  <div className="text-3xl font-black text-green-600">{stats.paid_bookings}</div>
                  <div className="text-xs text-gray-500 mt-1">Pagate</div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                  <div className="text-3xl font-black text-blue-600">€{stats.paid_bookings * 67}</div>
                  <div className="text-xs text-gray-500 mt-1">Incasso</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
