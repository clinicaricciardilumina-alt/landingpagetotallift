import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, ChevronLeft, Phone, MapPin, Send, Settings, Calendar, Layout } from "lucide-react";
import { Link } from "react-router-dom";
import type { LandingSettings, Question } from "../types";

export default function LandingPage() {
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState<"hero" | "benefits" | "questions" | "booking">("hero");
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "bot", text: "Ciao! 👋 Hai domande su Total Lift?" },
    { role: "bot", text: "Chiedimi di:\n• Efficacia\n• Risultati\n• Controindicazioni\n• Durata effetto" }
  ]);
  const [chatInput, setChatInput] = useState("");

  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then(res => res.json()).then(setSettings);
    fetch("/api/questions").then(res => res.json()).then(setQuestions);
    fetch("/api/slots").then(res => res.json()).then(setAvailableSlots);
  }, []);

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) return;
    setBookingLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime,
          answers,
          payment_status: "pending" // Simulate pending for demo
        })
      });
      if (res.ok) {
        alert("Prenotazione ricevuta! Verrai ricontattata per confermare il pagamento.");
        setCurrentStep("hero");
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSelectOption = (qid: number, option: string) => {
    setAnswers(prev => ({ ...prev, [qid]: option }));
  };

  const nextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setCurrentStep("booking");
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
    }
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim().toLowerCase();
    setChatMessages(prev => [...prev, { role: "user", text: chatInput }]);
    setChatInput("");

    setTimeout(() => {
      let response = "👍 Buona domanda! Contatta il nostro staff per altre informazioni.";
      if (userMsg.includes("efficacia")) response = "✅ Total Lift offre risultati immediati al 40% e massimi dopo 3 settimane.";
      else if (userMsg.includes("risultati")) response = "👁️ Migliora l'elasticità e crea un lifting naturale.";
      else if (userMsg.includes("controindicaz")) response = "✓ Nessuna controindicazione particolare. Sconsigliato in gravidanza.";
      else if (userMsg.includes("dura")) response = "⏳ Gli effetti durano 6-9 mesi.";
      
      setChatMessages(prev => [...prev, { role: "bot", text: response }]);
    }, 500);
  };

  if (!settings) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="font-sans text-gray-900 bg-[#f5f8fa] min-h-screen">
      {/* Header */}
      <header className="bg-white px-8 py-5 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <div className="text-2xl font-bold text-[#0066A1] tracking-tight">
              RICCIARDI
              <span className="block text-[0.7rem] text-gray-400 font-medium uppercase tracking-widest mt-1">Studio Dentistico</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-500">
              <Phone size={16} className="text-[#0066A1]" /> 099 888 4995
            </div>
            <Link 
              to="/admin" 
              className="flex items-center gap-2 bg-[#f5f8fa] text-[#0066A1] px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#E8F4F8] transition-colors"
            >
              <Layout size={14} /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Navigation / Flow */}
        <AnimatePresence mode="wait">
          {currentStep === "hero" && (
            <motion.section 
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-br from-[#E8F4F8] to-[#D0E8F2] py-12 px-6"
            >
              <div className="max-w-4xl mx-auto text-center">
                <div className="mb-8 max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
                  <img src={settings.hero_image} alt="Total Lift Hero" className="w-full h-auto object-cover" />
                </div>
                <h1 className="text-5xl font-bold text-[#0066A1] mb-2">{settings.hero_title}</h1>
                <p className="text-xl text-gray-600 mb-6 font-normal">{settings.hero_subtitle}</p>
                <div className="text-[#0066A1] font-bold uppercase tracking-widest mb-8">{settings.hero_date}</div>
                <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto mb-10">
                  {settings.hero_description}
                </p>
                <button 
                  onClick={() => setCurrentStep("questions")}
                  className="bg-[#0066A1] text-white px-10 py-5 rounded-xl font-bold text-lg uppercase tracking-tight shadow-xl hover:bg-[#004d7a] transition-all transform hover:-translate-y-1"
                >
                  {settings.cta_text}
                </button>
              </div>
            </motion.section>
          )}

          {currentStep === "questions" && (
            <motion.section 
              key="questions"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="py-16 px-6 max-w-3xl mx-auto"
            >
              <div className="w-full bg-gray-200 h-1.5 rounded-full mb-12 overflow-hidden">
                <motion.div 
                  className="bg-[#0066A1] h-full"
                  animate={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }}
                />
              </div>

              {questions[currentQuestionIdx] && (
                <div>
                  <h2 className="text-3xl font-bold text-[#0066A1] mb-8">{questions[currentQuestionIdx].text}</h2>
                  <div className="space-y-4">
                    {questions[currentQuestionIdx].options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectOption(questions[currentQuestionIdx].id, opt)}
                        className={cn(
                          "w-full p-6 text-left border-2 rounded-xl transition-all relative group",
                          answers[questions[currentQuestionIdx].id] === opt 
                            ? "border-[#0066A1] bg-[#E8F4F8] ring-4 ring-[#0066A1]/10" 
                            : "border-gray-200 bg-white hover:border-[#0066A1] hover:bg-gray-50"
                        )}
                      >
                        <span className="font-semibold text-lg">{opt}</span>
                        {answers[questions[currentQuestionIdx].id] === opt && (
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-[#0066A1] text-white p-1 rounded-full">
                            <Check size={16} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-12 flex gap-4">
                    <button 
                      onClick={prevQuestion}
                      className={cn(
                        "flex-1 py-4 bg-gray-100 rounded-xl font-bold text-gray-500",
                        currentQuestionIdx === 0 && "opacity-0 pointer-events-none"
                      )}
                    >
                      Indietro
                    </button>
                    <button 
                      onClick={nextQuestion}
                      disabled={!answers[questions[currentQuestionIdx].id]}
                      className="flex-1 py-4 bg-[#0066A1] text-white rounded-xl font-bold disabled:opacity-30"
                    >
                      Continua
                    </button>
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {currentStep === "booking" && (
            <motion.section 
              key="booking"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-16 px-6 max-w-5xl mx-auto"
            >
              <h2 className="text-4xl font-bold text-center text-[#0066A1] mb-12">Prenota il tuo Open Day</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-[#0066A1] mb-6 flex items-center gap-2">
                       <Calendar size={20} /> Scegli la tua sessione
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {availableSlots.length === 0 ? (
                        <p className="col-span-full py-12 text-center text-gray-400 font-medium">Nessuno slot disponibile al momento.</p>
                      ) : (
                        availableSlots.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedDate(s.date);
                              setSelectedTime(s.time);
                            }}
                            className={cn(
                              "text-left p-6 rounded-2xl border-2 transition-all",
                              selectedDate === s.date && selectedTime === s.time
                                ? "border-[#0066A1] bg-[#E8F4F8]"
                                : "border-gray-100 hover:border-[#0066A1]/30"
                            )}
                          >
                            <div className="font-black text-[#0066A1] text-lg">
                              {new Date(s.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                            </div>
                            <div className="text-gray-500 font-bold uppercase tracking-widest text-sm mt-1">{s.time}</div>
                            <div className="text-xs text-gray-400 mt-2 font-medium">Disponibilità: {s.capacity - s.booked} posti</div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-[#0066A1] text-white p-8 rounded-3xl shadow-xl h-fit sticky top-28">
                  <h3 className="text-xl font-bold mb-6">Riepilogo</h3>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between border-b border-white/20 pb-4">
                      <span className="opacity-80">Data</span>
                      <span className="font-bold">{selectedDate ? new Date(selectedDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/20 pb-4">
                      <span className="opacity-80">Ora</span>
                      <span className="font-bold">{selectedTime || "—"}</span>
                    </div>
                  </div>
                  <div className="bg-white/10 p-6 rounded-xl text-center mb-8">
                    <div className="text-4xl font-black mb-1">€67</div>
                    <div className="text-xs opacity-80 uppercase tracking-widest font-bold">Consulenza + Trattamento</div>
                  </div>
                  <button 
                    onClick={handleBooking}
                    disabled={!selectedDate || !selectedTime || bookingLoading}
                    className="w-full bg-[#7CB342] py-4 rounded-xl font-bold text-lg hover:bg-[#689F38] transition-colors shadow-lg active:scale-95 disabled:opacity-30"
                  >
                    {bookingLoading ? "Elaborazione..." : "Prenota Ora"}
                  </button>
                  <p className="text-[0.65rem] text-center mt-4 opacity-60">🔒 Pagamento sicuro. Conferma immediata.</p>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Chat */}
      <div className="fixed bottom-8 right-8 z-[100]">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setChatOpen(!chatOpen)}
          className="w-16 h-16 bg-[#0066A1] text-white rounded-full shadow-2xl flex items-center justify-center text-2xl"
        >
          {chatOpen ? "✕" : "💬"}
        </motion.button>
        
        <AnimatePresence>
          {chatOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              className="absolute bottom-20 right-0 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[450px]"
            >
              <div className="bg-gradient-to-r from-[#0066A1] to-[#004d7a] p-6 text-white shrink-0">
                <h3 className="font-bold text-lg">Total Lift Assistant</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {chatMessages.map((m, i) => (
                  <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap shadow-sm",
                      m.role === "user" ? "bg-[#0066A1] text-white" : "bg-white text-gray-800 border-l-4 border-[#0066A1]"
                    )}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-white border-t flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyPress={e => e.key === "Enter" && sendChatMessage()}
                  placeholder="Scrivi qui..." 
                  className="flex-1 bg-gray-100 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#0066A1]"
                />
                <button 
                  onClick={sendChatMessage}
                  className="bg-[#0066A1] text-white p-2 rounded-lg"
                >
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="bg-[#0066A1] text-white py-16 px-8 mt-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-xl font-bold mb-6 text-[#D0E8F2]">Studio Ricciardi</h3>
            <div className="flex items-start gap-3 opacity-80 mb-4">
              <MapPin size={20} className="shrink-0" />
              <span>Viale Imbriani, 40<br />Palagiano (TA)</span>
            </div>
            <a 
              href="/admin" 
              className="inline-flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors mt-4"
            >
              <Settings size={12} /> Dashboard Amministratore
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
