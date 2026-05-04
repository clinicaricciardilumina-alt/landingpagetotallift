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
    await firebaseService.addQuestion({ text: "Nuova Domanda", options: ["Opzione 1", "Opzione 2"] });
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

  if (!settings) return <div className="p-8 text-center font-bold text-gray-500">Loading Dashboard...</div>;

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
                <div className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Conversion Rate</div>
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
                  {saveStatus === "success" ? "Salvato con successo!" : "Errore salvataggio"}
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
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Titolo Principale</label>
                        <input 
                          value={settings.hero_title} 
                          onChange={e => setSettings({...settings, hero_title: e.target.value})}
                          className="w-full bg-gray-50 border-gray-200 rounded-xl p-4 font-bold text-gray-800 outline-none focus:ring-4 focus:ring-[#0066A1]/10 focus:border-[#0066A1] transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Data Evento</label>
                          <input 
                            value={settings.hero_date} 
                            onChange={e => setSettings({...settings, hero_date: e.target.value})}
                            className="w-full bg-gray-50 border-gray-200 rounded-xl p-4 font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Testo Bottone</label>
                          <input 
                            value={settings.cta_text} 
                            onChange={e => setSettings({...settings, cta_text: e.target.value})}
                            className="w-full bg-gray-50 border-gray-200 rounded-xl p-4 font-bold"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Descrizione</label>
                        <textarea 
                          rows={4}
                          value={settings.hero_description} 
                          onChange={e => setSettings({...settings, hero_description: e.target.value})}
                          className="w-full bg-gray-50 border-gray-200 rounded-xl p-4 font-medium text-gray-600 outline-none focus:ring-4 focus:ring-[#0066A1]/10 focus:border-[#0066A1] resize-none"
                        />
                      </div>
                    </div>
                  </section>
                  
                  <button 
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="w-full bg-[#7CB342] text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-[#7CB342]/20 hover:bg-[#689F38] transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? "Salvataggio..." : "Salva Configurazione"}
                  </button>
                </div>

                <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
                  <h3 className="text-lg font-black text-[#0066A1] mb-6 flex items-center gap-2 uppercase tracking-widest">
                    <ImageIcon size={20} /> Gestione Immagini
                  </h3>
                  
                  <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {availableImages.map(img => {
                      const isSelected = settings.selected_images.includes(img);
                      const isHero = settings.hero_image === `/images/${img}`;
                      const imageUrls = settings.image_urls || {};
                      const currentUrl = imageUrls[img] || `/images/${img}`;

                      return (
                        <div key={img} className="group border-2 border-gray-50 rounded-2xl p-5 hover:border-[#0066A1]/30 transition-all bg-gray-50/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleImageSelection(img)}
                                className="w-5 h-5 rounded border-gray-300 text-[#0066A1] focus:ring-[#0066A1]"
                              />
                              <span className="font-bold text-gray-800">{img}</span>
                            </label>
                            {isHero && (
                              <span className="bg-[#0066A1] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">Hero</span>
                            )}
                          </div>

                          <div className="space-y-2">
