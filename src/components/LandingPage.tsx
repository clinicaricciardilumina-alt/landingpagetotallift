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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

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
        hero_image: "/images/hero.jpg",
        selected_images: [],
        image_urls: {}
      });

      setQuestions(questionsData);
      setSlots(slotsData);
    } catch (e) {
      console.error("Errore caricamento dati:", e);
    } finally {
      setLoading(false);
    }
  };

  const getNextQuestion = (): any => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return null;

    const nextQuestion = questions.find((q: any) => {
      if (!q.cascata) return false;
      return (
        q.cascata.domanda_id === currentQuestion.id &&
        q.cascata.risposta === answers[currentQuestion.id]
      );
    });

    if (nextQuestion) return nextQuestion;

    const nextIndex = currentQuestionIndex + 1;
    let searchIndex = nextIndex;
    while (searchIndex < questions.length) {
      const q = questions[searchIndex];
      if (!q.cascata) return q;
      searchIndex++;
    }

    return null;
  };

  const handleAnswerAndNext = (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers({ ...answers, [currentQuestion.id]: answer });

    const nextQuestion = getNextQuestion();
    if (nextQuestion) {
      const nextIndex = questions.findIndex((q) => q.id === nextQuestion.id);
      setCurrentQuestionIndex(nextIndex);
    } else {
      setQuizCompleted(true);
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

      {/* Galleria Immagini */}
      {settings?.selected_images && settings.selected_images.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-4xl font-black text-[#0066A1] mb-12 text-center">Galleria</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {settings.selected_images.map((img: string) => {
                const imageUrls = settings.image_urls || {};
                const url = imageUrls[img] || `/images/${img}`;
                return (
                  <div key={img} className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all">
                    <img 
                      src={url}
                      alt={img}
                      className="w-full h-64 object-cover hover:scale-105 transition-transform"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Quiz Section */}
      {!quizCompleted && questions.length > 0 && (
        <section className="py-20 bg-[#f5f8fa]">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-4xl font-black text-[#0066A1] mb-12 text-center">Rispondi al Quiz</h2>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              {/* Indicatore di progresso */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-gray-600">Domanda {currentQuestionIndex + 1} di {questions.length}</span>
                  <span className="text-sm font-bold text-[#0066A1]">{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#0066A1] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Domanda Corrente */}
              {questions[currentQuestionIndex] && (
                <div className="space-y-6">
                  <h3 className="font-black text-2xl text-gray-800">{questions[currentQuestionIndex].text}</h3>
                  <div className="space-y-3">
                    {questions[currentQuestionIndex].options.map((opt: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswerAndNext(opt)}
                        className={`w-full p-4 rounded-xl border-2 font-bold text-left transition-all ${
                          answers[questions[currentQuestionIndex].id] === opt
                            ? "border-[#0066A1] bg-[#E8F4F8] text-[#0066A1]"
                            : "border-gray-200 bg-white text-gray-800 hover:border-[#0066A1] hover:bg-[#f0f8fc]"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {/* Pulsante Avanti (se già risposto) */}
                  {answers[questions[currentQuestionIndex].id] && (
                    <button
                      onClick={() => {
                        const nextQuestion = getNextQuestion();
                        if (nextQuestion) {
                          const nextIndex = questions.findIndex((q) => q.id === nextQuestion.id);
                          setCurrentQuestionIndex(nextIndex);
                        } else {
                          setQuizCompleted(true);
                        }
                      }}
                      className="w-full bg-[#0066A1] text-white py-4 rounded-xl font-black text-lg hover:bg-[#004d7a] transition-all mt-4"
                    >
                      {getNextQuestion() ? "Avanti →" : "Completa Quiz ✓"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Booking Section */}
      {quizCompleted && (
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-black text-[#0066A1] mb-12 text-center">Prenota il Tuo Slot</h2>
          <form onSubmit={handleBooking} className="bg-white p-8 rounded-2xl shadow-lg space-y-6">

            {/* Slot Selection */}
            <div>
              <label className="block font-bold mb-6 text-gray-800">Scegli Data e Ora:</label>
              <div className="space-y-6">
                {Object.entries(
                  slots.reduce((acc: any, s: any) => {
                    if (!acc[s.date]) acc[s.date] = [];
                    acc[s.date].push(s);
                    return acc;
                  }, {})
                )
                  .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                  .map(([date, dateSlots]: any) => (
                    <div key={date}>
                      <h3 className="text-2xl font-black text-[#0066A1] mb-4">{date}</h3>
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {dateSlots.map((s: any) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSelectedSlot(s)}
                            className={`p-3 rounded-lg border-2 font-bold transition-all text-sm ${
                              selectedSlot?.id === s.id
                                ? "border-[#0066A1] bg-[#E8F4F8] text-[#0066A1]"
                                : "border-gray-200 bg-white text-gray-800 hover:border-[#0066A1]"
                            }`}
                          >
                            {s.time}
                          </button>
                        ))}
                      </div>
                    </div>
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
      )}

      {/* Footer */}
      <footer className="bg-[#0066A1] text-white text-center py-8">
        <p className="font-bold">Studio Ricciardi © 2024</p>
      </footer>
    </div>
  );
}
