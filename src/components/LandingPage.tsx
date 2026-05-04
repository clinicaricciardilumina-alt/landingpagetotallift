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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const settingsData = await firebaseService.getSettings();
      const questionsData = await firebaseService.getQuestions();
      const slotsData = await firebaseService.getSlots();

      setSettings(settingsData || {
        hero_title: "TOTAL LIFT",
        hero_subtitle: "Total Beauty Day",
        hero_date: "Mercoledì 19 Novembre",
        hero_description: "Scopri le nostre soluzioni per il ringiovanimento del volto senza bisturi.",
        cta_text: "Scopri le nostre soluzioni",
        hero_image: "/images/hero.jpg"
      });
      setQuestions(questionsData);
      setSlots(slotsData);
    } catch (e) {
      console.error("Errore caricamento dati:", e);
    } finally {
      setLoading(false);
    }
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
      loadData();
    } catch (e) {
      alert("❌ Errore nella prenotazione");
      console.error(e);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold">Caricamento...</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative min-h-screen bg-gradient-to-r from-[#0066A1] to-[#004d7a] text-white flex items-center">
        <div className="absolute inset-0 opacity-20">
          {settings?.hero_image && (
            <img src={settings.hero_image} className="w-full h-full object-cover" alt="hero" />
          )}
        </div>
        
        <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-black mb-4"
          >
            {settings?.hero_title}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold mb-4"
          >
            {settings?.hero_subtitle}
          </motion.p>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl mb-6 opacity-90"
          >
            {settings?.hero_date}
          </motion.p>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg mb-10 max-w-2xl mx-auto opacity-80"
          >
            {settings?.hero_description}
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white text-[#0066A1] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#f0f0f0] transition-all"
          >
            {settings?.cta_text}
          </motion.button>
        </div>
      </section>

      {/* Quiz Section */}
      <section className="py-20 bg-[#f5f8fa]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-black text-[#0066A1] mb-12 text-center">Rispondi al Quiz</h2>

          <div className="space-y-8 bg-white p-8 rounded-2xl shadow-lg">
            {questions.map((q) => (
              <div key={q.id} className="space-y-4">
                <h3 className="font-bold text-lg text-gray-800">{q.text}</h3>
                <div className="space-y-2">
                  {q.options.map((opt: string, idx: number) => (
                    <label key={idx} className="flex items-center gap-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={opt}
                        onChange={() => setAnswers({...answers, [q.id]: opt})}
                        className="w-4 h-4"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-black text-[#0066A1] mb-12 text-center">Prenota il Tuo Slot</h2>

          <form onSubmit={handleBooking} className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
            {/* Slot Selection */}
            <div>
              <label className="block font-bold mb-4 text-gray-800">Scegli Data e Ora:</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {slots.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSlot(s)}
                    className={`p-4 rounded-lg border-2 font-bold transition-all ${
                      selectedSlot?.id === s.id
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

            {/* Personal Info */}
            <div>
              <label className="block font-bold mb-2 text-gray-800">Nome *</label>
              <input
                type="text"
                value={bookingForm.name}
                onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                className="w-full border border-gray-200 rounded-lg p-3 font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-bold mb-2 text-gray-800">Email *</label>
              <input
                type="email"
                value={bookingForm.email}
                onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                className="w-full border border-gray-200 rounded-lg p-3 font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-bold mb-2 text-gray-800">Telefono</label>
              <input
                type="tel"
                value={bookingForm.phone}
                onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                className="w-full border border-gray-200 rounded-lg p-3 font-bold"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-[#0066A1] text-white py-4 rounded-lg font-black text-lg hover:bg-[#004d7a] transition-all"
            >
              ✓ Conferma Prenotazione
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0066A1] text-white text-center py-8">
        <p className="font-bold">Studio Ricciardi © 2024</p>
      </footer>
    </div>
  );
}
