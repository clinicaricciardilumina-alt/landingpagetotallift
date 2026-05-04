import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import * as firebaseService from "../lib/firebaseService";

export default function LandingPage() {
  const [settings, setSettings] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any>({});
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [bookingForm, setBookingForm] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [visibleQuestions, setVisibleQuestions] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToSettings((settingsData) => {
      setSettings(settingsData || defaultSettings);
    });

    loadQuestionsAndSlots();

    return () => unsubscribe();
  }, []);

  const loadQuestionsAndSlots = async () => {
    try {
      const [questionsData, slotsData] = await Promise.all([
        firebaseService.getQuestions(),
        firebaseService.getSlots()
      ]);
      setQuestions(questionsData);
      setSlots(slotsData);
      setVisibleQuestions(questionsData.filter((q: any) => !q.cascata).map((q: any) => q.id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({...answers, [questionId]: answer});
    
    const nextQuestions = questions
      .filter((q: any) => q.cascata && q.cascata.domanda_id === questionId && q.cascata.risposta === answer)
      .map((q: any) => q.id);
    
    setVisibleQuestions([
      ...visibleQuestions.filter((qId: string) => !questions.find((q: any) => q.cascata?.domanda_id === questionId)),
      ...nextQuestions
    ]);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.name || !bookingForm.email || !selectedSlot) {
      alert("Compila tutti i campi");
      return;
    }
    try {
      await firebaseService.addBooking({
        name: bookingForm.name,
        email: bookingForm.email,
        phone: bookingForm.phone,
        date: selectedSlot.date,
        time: selectedSlot.time,
        answers: answers,
        payment_status: "pending"
      });
      alert("✅ Prenotazione confermata!");
      setBookingForm({ name: "", email: "", phone: "" });
      setSelectedSlot(null);
      setAnswers({});
    } catch (e) {
      alert("❌ Errore");
      console.error(e);
    }
  };

  const defaultSettings = {
    hero_title: "TOTAL LIFT",
    hero_subtitle: "Total Beauty Day",
    hero_date: "Mercoledì 19 Novembre",
    hero_description: "Scopri le nostre soluzioni per il ringiovanimento...",
    cta_text: "Scopri le nostre soluzioni",
    hero_image: "/images/hero.jpg"
  };

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500 font-bold">Caricamento...</div>;

  return (
    <div className="min-h-screen bg-white">
      <section className="min-h-screen bg-gradient-to-r from-[#0066A1] to-[#004d7a] text-white flex items-center px-6">
        <div className="max-w-4xl mx-auto text-center w-full">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-6xl font-black mb-4">
            {settings?.hero_title}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl font-bold mb-4">
            {settings?.hero_subtitle}
          </motion.p>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl mb-6 opacity-90">
            {settings?.hero_date}
          </motion.p>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-lg mb-10 opacity-80">
            {settings?.hero_description}
          </motion.p>
          <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white text-[#0066A1] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100">
            {settings?.cta_text}
          </motion.button>
        </div>
      </section>

      <section className="py-20 bg-[#f5f8fa] px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-[#0066A1] mb-12 text-center">Rispondi al Quiz</h2>
          <div className="bg-white p-8 rounded-2xl shadow-lg space-y-8">
            {questions.filter((q: any) => visibleQuestions.includes(q.id)).map((q: any) => (
              <div key={q.id}>
                <h3 className="font-bold text-lg mb-3">{q.text}</h3>
                {q.type === "text" ? (
                  <textarea
                    value={answers[q.id] || ""}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    className="w-full border p-3 rounded"
                    rows={3}
                    placeholder="La tua risposta..."
                  />
                ) : (
                  <div className="space-y-2">
                    {q.options.map((opt: string, idx: number) => (
                      <label key={idx} className="flex items-center gap-3 cursor-pointer p-3 hover:bg-gray-50 rounded">
                        <input
                          type={q.type === "single" ? "radio" : "checkbox"}
                          name={`q-${q.id}`}
                          value={opt}
                          checked={q.type === "single" ? answers[q.id] === opt : (answers[q.id] || []).includes(opt)}
                          onChange={() => {
                            if (q.type === "single") {
                              handleAnswerChange(q.id, opt);
                            } else {
                              const current = answers[q.id] || [];
                              const updated = current.includes(opt)
                                ? current.filter((a: string) => a !== opt)
                                : [...current, opt];
                              handleAnswerChange(q.id, updated);
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-[#0066A1] mb-12 text-center">Prenota il Tuo Slot</h2>
          <form onSubmit={handleBooking} className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
            <div>
              <label className="block font-bold mb-4">Data e Ora:</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {slots.map((s: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSlot(s)}
                    className={`p-4 rounded-lg border-2 font-bold transition-all ${
                      selectedSlot?.date === s.date && selectedSlot?.time === s.time
                        ? "border-[#0066A1] bg-[#E8F4F8] text-[#0066A1]"
                        : "border-gray-200 hover:border-[#0066A1]"
                    }`}
                  >
                    <div>{s.date}</div>
                    <div className="text-sm">{s.time}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold mb-2">Nome *</label>
              <input
                type="text"
                value={bookingForm.name}
                onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-3"
                required
              />
            </div>

            <div>
              <label className="block font-bold mb-2">Email *</label>
              <input
                type="email"
                value={bookingForm.email}
                onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-3"
                required
              />
            </div>

            <div>
              <label className="block font-bold mb-2">Telefono</label>
              <input
                type="tel"
                value={bookingForm.phone}
                onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-3"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0066A1] text-white py-4 rounded-lg font-black text-lg hover:bg-[#004d7a]"
            >
              ✓ Conferma Prenotazione
            </button>
          </form>
        </div>
      </section>

      <footer className="bg-[#0066A1] text-white text-center py-8">
        <p className="font-bold">Studio Ricciardi © 2024</p>
      </footer>
    </div>
  );
}
