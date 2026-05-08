import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Save, Image as ImageIcon, Layout, Settings, CheckCircle2, AlertCircle, 
  Trash2, Plus, Calendar, Users, BarChart3, HelpCircle, ChevronRight,
  ExternalLink, Clock
} from "lucide-react";
import type { LandingSettings, Question } from "../types";
import { cn } from "../lib/utils";

type Tab = "customize" | "questions" | "slots" | "bookings" | "stats";

interface AdminDashboardProps {
  setIsAuthenticated: (val: boolean) => void;
}

export default function AdminDashboard({ setIsAuthenticated }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("customize");
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  // Slot Form State
  const [slotForm, setSlotForm] = useState({ date: "", time: "09:00", capacity: 4 });

  useEffect(() => {
    refreshAllData();
  }, [activeTab]);

  const refreshAllData = () => {
    fetch("/api/settings").then(res => res.json()).then(setSettings);
    fetch("/api/questions").then(res => res.json()).then(setQuestions);
    fetch("/api/slots").then(res => res.json()).then(setSlots);
    fetch("/api/bookings").then(res => res.json()).then(setBookings);
    fetch("/api/stats").then(res => res.json()).then(setStats);
    fetch("/api/images").then(res => res.json()).then(setAvailableImages);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) setSaveStatus("success");
      else setSaveStatus("error");
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const addQuestion = async () => {
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Nuova Domanda", options: ["Opzione 1", "Opzione 2"] })
    });
    if (res.ok) refreshAllData();
  };

  const deleteQuestion = async (id: number) => {
    if (!confirm("Eliminare questa domanda?")) return;
    await fetch(`/api/questions/${id}`, { method: "DELETE" });
    refreshAllData();
  };

  const createSlot = async () => {
    if (!slotForm.date) return alert("Scegli una data");
    await fetch("/api/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slotForm)
    });
    refreshAllData();
  };

  const deleteSlot = async (date: string, time: string) => {
    if (!confirm("Eliminare questo slot?")) return;
    await fetch(`/api/slots/${date}/${time}`, { method: "DELETE" });
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
      {/* Sidebar */}
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

      {/* Main Content */}
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

          {/* Global Stats bar like in HTML */}
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

          {/* Subheader and Success Alert */}
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
            {/* TAB: CUSTOMIZE */}
            {activeTab === "customize" && (
              <motion.div 
                key="customize"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-10"
              >
                {/* Text Settings */}
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

                {/* Image Management */}
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

                          {/* URL Input */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">URL Immagine</label>
                            <input
                              type="text"
                              value={currentUrl}
                              onChange={(e) => {
                                const newUrls = {...imageUrls, [img]: e.target.value};
                                setSettings({...settings, image_urls: newUrls});
                              }}
                              placeholder="es: /images/hero.jpg oppure https://..."
                              className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-medium focus:border-[#0066A1] focus:ring-2 focus:ring-[#0066A1]/20 outline-none"
                            />
                            <p className="text-[10px] text-gray-400">Formati: /images/file.jpg • https://url • data:image/jpeg;base64,...</p>
                          </div>

                          {/* Preview */}
                          <div className="aspect-video rounded-lg overflow-hidden bg-gray-300 relative group/preview">
                            <img
                              src={currentUrl}
                              className="w-full h-full object-cover"
                              alt="preview"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling!.style.display = 'flex';
                              }}
                            />
                            <div
                              className="absolute inset-0 bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center"
                              style={{display: 'none'}}
                            >
                              ⚠️ Immagine non trovata
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center p-4">
                               <button
                                onClick={() => setSettings({...settings, hero_image: currentUrl})}
                                className="bg-white text-[#0066A1] px-3 py-2 rounded-lg font-bold text-xs"
                               >
                                Imposta come Hero
                               </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              </motion.div>
            )}

            {/* TAB: QUESTIONS */}
            {activeTab === "questions" && (
              <motion.div 
                key="questions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-[#0066A1]">Domande del Quiz</h3>
                  <button 
                    onClick={addQuestion}
                    className="flex items-center gap-2 bg-[#0066A1] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                  >
                    <Plus size={18} /> Nuova Domanda
                  </button>
                </div>

                <div className="grid gap-6">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex gap-6 group hover:border-[#0066A1]/40 transition-all">
                      <div className="w-12 h-12 bg-[#E8F4F8] text-[#0066A1] font-black rounded-2xl flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-4">
                        <input 
                          value={q.text} 
                          onChange={e => {
                            const newQs = [...questions];
                            newQs[idx].text = e.target.value;
                            setQuestions(newQs);
                          }}
                          className="w-full text-xl font-bold bg-transparent border-none outline-none focus:ring-0"
                        />
                        <div className="flex flex-wrap gap-2">
                           {q.options.map((opt, oIdx) => (
                             <span key={oIdx} className="bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium text-gray-500">
                               {opt}
                             </span>
                           ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                         <button 
                          onClick={() => deleteQuestion(q.id)}
                          className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                         >
                            <Trash2 size={20} />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB: SLOTS */}
            {activeTab === "slots" && (
              <motion.div 
                key="slots"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-10"
              >
                <div className="lg:col-span-1 space-y-8">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-black text-[#0066A1] mb-6 flex items-center gap-2">
                      <Clock size={20} /> Aggiungi Slot
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Data</label>
                        <input 
                          type="date" 
                          value={slotForm.date}
                          onChange={e => setSlotForm({...slotForm, date: e.target.value})}
                          className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Ora</label>
                        <select 
                          value={slotForm.time}
                          onChange={e => setSlotForm({...slotForm, time: e.target.value})}
                          className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold"
                        >
                          {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Capacità</label>
                        <input 
                          type="number" 
                          value={slotForm.capacity}
                          onChange={e => setSlotForm({...slotForm, capacity: parseInt(e.target.value)})}
                          className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold"
                        />
                      </div>
                      <button 
                        onClick={createSlot}
                        className="w-full bg-[#0066A1] text-white py-4 rounded-xl font-bold hover:bg-[#004d7a] transition-all shadow-xl shadow-[#0066A1]/20"
                      >
                        Crea Disponibilità
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {slots.map(s => (
                      <div key={s.date + s.time} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                        <div>
                          <div className="font-black text-[#0066A1]">{new Date(s.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}</div>
                          <div className="text-gray-400 font-bold text-sm uppercase tracking-widest">{s.time}</div>
                          <div className="text-xs text-gray-500 mt-1 font-medium">{s.booked} / {s.capacity} prenotati</div>
                        </div>
                        <button 
                          onClick={() => deleteSlot(s.date, s.time)}
                          className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: BOOKINGS */}
            {activeTab === "bookings" && (
              <motion.div 
                key="bookings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#f5f8fa] border-b">
                      <tr>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data & Ora</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Registrata</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {bookings.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="font-bold text-gray-800">{b.name || "Anonimo"}</div>
                            <div className="text-xs text-gray-400 font-medium">{b.email || "No email"}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="font-bold text-[#0066A1]">{b.date}</div>
                            <div className="text-xs text-gray-400 font-bold">{b.time}</div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest",
                              b.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                            )}>
                              {b.payment_status === "paid" ? "Pagato" : "In attesa"}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-sm text-gray-400 font-medium">
                            {new Date(b.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* TAB: STATS */}
            {activeTab === "stats" && stats && (
              <motion.div 
                key="stats"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 text-center">
                  <div className="w-16 h-16 bg-[#E8F4F8] text-[#0066A1] rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Users size={32} />
                  </div>
                  <div className="text-5xl font-black text-gray-900 mb-2">{stats.total_bookings}</div>
                  <div className="text-gray-400 font-bold text-xs uppercase tracking-widest">Interessati Totali</div>
                </div>
                <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 text-center">
                  <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="text-5xl font-black text-gray-900 mb-2">{stats.paid_bookings}</div>
                  <div className="text-gray-400 font-bold text-xs uppercase tracking-widest">Conversioni Pagate</div>
                </div>
                <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 text-center">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <BarChart3 size={32} />
                  </div>
                  <div className="text-5xl font-black text-gray-900 mb-2">€{stats.paid_bookings * 67}</div>
                  <div className="text-gray-400 font-bold text-xs uppercase tracking-widest">Incasso Stimato</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
