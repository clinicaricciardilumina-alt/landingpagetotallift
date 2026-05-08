import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { LandingPageDoc, ContactForm, FunnelQuestion, ThankYouPage, BookingSlot, Lead } from "../types";
import * as funnelService from "../lib/funnelService";

export default function DynamicLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [landing, setLanding] = useState<LandingPageDoc | null>(null);
  const [form, setForm] = useState<ContactForm | null>(null);
  const [thankYouPage, setThankYouPage] = useState<ThankYouPage | null>(null);
  const [questions, setQuestions] = useState<FunnelQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Quiz/funnel state
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [collectedTags, setCollectedTags] = useState<string[]>([]);
  const [collectedLevel, setCollectedLevel] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const l = await funnelService.getLandingBySlug(slug);
        if (!l || l.status !== "pubblicata") {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setLanding(l);

        if (l.formId) {
          const f = await funnelService.getContactFormById(l.formId);
          setForm(f);
        }
        if (l.thankYouPageId) {
          const t = await funnelService.getThankYouPageById(l.thankYouPageId);
          setThankYouPage(t);
        }
        if (l.funnelId) {
          const funnel = await funnelService.getFunnelById(l.funnelId);
          if (funnel?.startQuestionId) {
            setCurrentQuestionId(funnel.startQuestionId);
          }
          const allQ = await funnelService.getFunnelQuestions();
          setQuestions(allQ.filter(q => q.funnelId === l.funnelId));
        }
        const allSlots = await funnelService.getBookingSlots();
        setSlots(allSlots.filter(s => s.status === "disponibile" && !s.isBlocked));
        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Caricamento...</div>;
  }
  if (notFound || !landing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <h1 className="text-4xl font-black text-gray-900 mb-4">Pagina non trovata</h1>
        <p className="text-gray-600 mb-6">La landing page che stai cercando non esiste o è stata rimossa.</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
        >
          Torna alla home
        </button>
      </div>
    );
  }

  const primary = landing.primaryColor || "#0066A1";
  const secondary = landing.secondaryColor || "#96C8E6";

  // ----- Quiz handlers -----
  const handleAnswer = (questionId: string, value: any, optionActions?: any[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));

    if (optionActions && optionActions.length > 0) {
      let nextQ: string | null = null;
      for (const action of optionActions) {
        switch (action.type) {
          case "next_question":
            nextQ = action.nextQuestionId || null;
            break;
          case "assign_tag":
            if (action.tag) setCollectedTags(prev => Array.from(new Set([...prev, action.tag])));
            break;
          case "assign_level":
            if (action.funnelLevel) setCollectedLevel(action.funnelLevel);
            break;
          case "go_to_form":
            setCurrentQuestionId(null);
            return;
          case "go_to_thank_you":
            setShowThankYou(true);
            setCurrentQuestionId(null);
            return;
          case "show_booking":
            setShowBooking(true);
            setCurrentQuestionId(null);
            return;
          case "stop_flow":
            setCurrentQuestionId(null);
            return;
          case "external_url":
            if (action.externalUrl) window.location.href = action.externalUrl;
            return;
        }
      }
      setCurrentQuestionId(nextQ);
    } else {
      // niente azione: passa alla domanda successiva per ordine
      const sorted = [...questions].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex(q => q.id === questionId);
      const next = sorted[idx + 1];
      setCurrentQuestionId(next ? next.id : null);
    }
  };

  // ----- Form submit -----
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form && !landing.formId) return;
    if (form?.privacyConsentRequired && !privacyConsent) {
      alert("Devi accettare la privacy policy per continuare");
      return;
    }

    const lead: Omit<Lead, "id"> = {
      firstName: formData.firstName || formData.nome || "",
      lastName: formData.lastName || formData.cognome || "",
      phone: formData.phone || formData.telefono || "",
      email: formData.email || "",
      landingId: landing.id,
      landingName: landing.internalName,
      funnelId: landing.funnelId,
      formId: form?.id,
      answers,
      formData,
      tags: [...collectedTags, ...(form?.tagsToAssign || [])],
      funnelLevel: (collectedLevel as any) || form?.funnelLevelToAssign || "lead_freddo",
      status: "nuovo",
      emailsSent: [],
      notificationsSent: [],
      actionLog: [
        {
          id: `log_${Date.now()}`,
          type: "lead_created",
          description: `Lead creato dalla landing "${landing.internalName}"`,
          timestamp: new Date().toISOString(),
        },
      ],
      privacyConsent,
      marketingConsent,
      acquiredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await funnelService.addLead(lead);
      setSubmitted(true);

      const action = form?.afterSubmitAction || "show_thank_you";
      if (action === "show_booking") {
        setShowBooking(true);
      } else if (action === "redirect_url" && form?.redirectUrl) {
        window.location.href = form.redirectUrl;
      } else {
        setShowThankYou(true);
      }
    } catch (e) {
      console.error(e);
      alert("Errore nell'invio del modulo");
    }
  };

  // ----- Booking -----
  const handleBookSlot = async (slot: BookingSlot) => {
    setSelectedSlot(slot);
    try {
      await funnelService.incrementBookingSlot(slot.id);
      setShowBooking(false);
      setShowThankYou(true);
    } catch (e) {
      console.error(e);
    }
  };

  // =====================================================
  // RENDER STATES
  // =====================================================
  if (showThankYou) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white p-12 rounded-3xl shadow-xl text-center">
          <div className="text-6xl mb-6">✓</div>
          <h1 className="text-4xl font-black mb-4" style={{ color: primary }}>
            {thankYouPage?.title || "Grazie!"}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            {thankYouPage?.message || "La tua richiesta è stata ricevuta. Ti contatteremo al più presto."}
          </p>
          {selectedSlot && (
            <div className="bg-green-50 p-6 rounded-2xl mb-6">
              <p className="font-bold text-green-800">Appuntamento confermato</p>
              <p className="text-green-700">
                {selectedSlot.date} alle {selectedSlot.time}
              </p>
            </div>
          )}
          {thankYouPage?.ctaText && thankYouPage.ctaUrl && (
            <a
              href={thankYouPage.ctaUrl}
              className="inline-block px-8 py-4 rounded-xl font-bold text-white"
              style={{ backgroundColor: primary }}
            >
              {thankYouPage.ctaText}
            </a>
          )}
        </div>
      </div>
    );
  }

  if (showBooking) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-xl">
          <h1 className="text-3xl font-black mb-6" style={{ color: primary }}>
            Scegli uno slot disponibile
          </h1>
          {slots.length === 0 ? (
            <p className="text-gray-600">Nessuno slot al momento disponibile. Ti contatteremo per fissare l'appuntamento.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {slots.map(slot => (
                <button
                  key={slot.id}
                  onClick={() => handleBookSlot(slot)}
                  className="p-4 border-2 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  style={{ borderColor: secondary }}
                >
                  <div className="font-bold text-gray-900">{slot.date}</div>
                  <div className="text-lg font-black" style={{ color: primary }}>{slot.time}</div>
                  <div className="text-xs text-gray-500">
                    {slot.maxBookings - slot.currentBookings} posti disponibili
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Quiz attivo
  if (currentQuestionId) {
    const q = questions.find(x => x.id === currentQuestionId);
    if (q) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white p-12 rounded-3xl shadow-xl">
            <h2 className="text-2xl md:text-3xl font-black mb-2 text-gray-900">{q.text}</h2>
            {q.description && <p className="text-gray-600 mb-8">{q.description}</p>}

            {(q.type === "single_choice" || q.type === "yes_no") && (
              <div className="space-y-3">
                {q.options.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleAnswer(q.id, opt.value, opt.actions)}
                    className="w-full p-4 text-left border-2 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all font-medium"
                    style={{ borderColor: secondary }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {q.type === "text" && (
              <div className="space-y-4">
                <input
                  type="text"
                  className="w-full p-4 border-2 rounded-xl focus:border-blue-500 outline-none"
                  style={{ borderColor: secondary }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAnswer(q.id, (e.target as HTMLInputElement).value, q.defaultActions);
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = (e.currentTarget.previousSibling as HTMLInputElement);
                    handleAnswer(q.id, input.value, q.defaultActions);
                  }}
                  className="px-6 py-3 rounded-xl font-bold text-white"
                  style={{ backgroundColor: primary }}
                >
                  Continua
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  // =====================================================
  // RENDER LANDING
  // =====================================================
  const sortedBlocks = [...(landing.blocks || [])].filter(b => b.visible).sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative py-20 md:py-32 px-6 overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}>
        <div className="max-w-6xl mx-auto text-center text-white relative z-10">
          {landing.heroImage && (
            <img src={landing.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          )}
          <h1 className="text-4xl md:text-6xl font-black mb-4 relative">{landing.headline}</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto relative">{landing.subtitle}</p>
          {landing.ctaText && (
            <button
              onClick={() => {
                if (landing.funnelId && questions.length > 0) {
                  const sorted = [...questions].sort((a, b) => a.order - b.order);
                  setCurrentQuestionId(sorted[0]?.id || null);
                } else {
                  document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="bg-white text-gray-900 px-10 py-5 rounded-xl text-lg font-black hover:scale-105 transition-transform shadow-2xl"
            >
              {landing.ctaText}
            </button>
          )}
        </div>
      </section>

      {/* BLOCCHI */}
      {sortedBlocks.map(block => (
        <BlockRenderer
          key={block.id}
          block={block}
          primary={primary}
          secondary={secondary}
          onStartQuiz={() => {
            if (questions.length > 0) {
              const sorted = [...questions].sort((a, b) => a.order - b.order);
              setCurrentQuestionId(sorted[0]?.id || null);
            }
          }}
        />
      ))}

      {/* FORM */}
      {form && !submitted && (
        <section id="form-section" className="py-16 px-6 bg-gray-50">
          <div className="max-w-2xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-xl">
            <h2 className="text-3xl font-black mb-6 text-gray-900">{form.internalName}</h2>
            {form.description && <p className="text-gray-600 mb-8">{form.description}</p>}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {[...(form.fields || [])].sort((a, b) => a.order - b.order).map(field => (
                <div key={field.id}>
                  <label className="block text-sm font-bold mb-2 text-gray-700">
                    {field.label}{field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      required={field.required}
                      placeholder={field.placeholder}
                      onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                      className="w-full p-3 border-2 rounded-xl focus:border-blue-500 outline-none"
                      style={{ borderColor: secondary }}
                      rows={4}
                    />
                  ) : field.type === "select" ? (
                    <select
                      required={field.required}
                      onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                      className="w-full p-3 border-2 rounded-xl focus:border-blue-500 outline-none"
                      style={{ borderColor: secondary }}
                    >
                      <option value="">-- Seleziona --</option>
                      {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      required={field.required}
                      placeholder={field.placeholder}
                      onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                      className="w-full p-3 border-2 rounded-xl focus:border-blue-500 outline-none"
                      style={{ borderColor: secondary }}
                    />
                  )}
                </div>
              ))}

              {form.privacyConsentRequired && (
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={privacyConsent} onChange={e => setPrivacyConsent(e.target.checked)} required />
                  <span>{form.privacyText || "Accetto la privacy policy"} *</span>
                </label>
              )}
              {form.marketingConsentEnabled && (
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={marketingConsent} onChange={e => setMarketingConsent(e.target.checked)} />
                  <span>{form.marketingText || "Acconsento a ricevere comunicazioni marketing"}</span>
                </label>
              )}

              <button
                type="submit"
                className="w-full py-4 rounded-xl font-black text-white text-lg hover:opacity-90 transition-all"
                style={{ backgroundColor: primary }}
              >
                Invia richiesta
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}

// =====================================================
// BLOCK RENDERER
// =====================================================
interface BlockRendererProps {
  block: any;
  primary: string;
  secondary: string;
  onStartQuiz: () => void;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ block, primary, secondary, onStartQuiz }) => {
  const d = block.data || {};
  switch (block.type) {
    case "problem_solution":
      return (
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="p-8 bg-red-50 rounded-2xl">
              <h3 className="text-2xl font-black mb-4 text-red-800">{d.problemTitle}</h3>
              <p className="text-gray-700">{d.problemText}</p>
            </div>
            <div className="p-8 rounded-2xl" style={{ backgroundColor: secondary + "33" }}>
              <h3 className="text-2xl font-black mb-4" style={{ color: primary }}>{d.solutionTitle}</h3>
              <p className="text-gray-700">{d.solutionText}</p>
            </div>
          </div>
        </section>
      );
    case "benefits":
      return (
        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-12 text-gray-900">{d.title}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(d.items || []).map((item: any, i: number) => (
                <div key={i} className="p-6 bg-white rounded-2xl shadow-sm">
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h3 className="font-black mb-2 text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    case "treatment":
      return (
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-4 text-gray-900">{d.title}</h2>
            <p className="text-center text-gray-600 mb-12">{d.description}</p>
            <div className="grid md:grid-cols-4 gap-6">
              {(d.steps || []).map((step: any, i: number) => (
                <div key={i} className="text-center p-6 rounded-2xl border-2" style={{ borderColor: secondary }}>
                  <div className="w-12 h-12 rounded-full text-white font-black flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: primary }}>{i + 1}</div>
                  <h3 className="font-black mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    case "testimonials":
      return (
        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-12 text-gray-900">{d.title}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {(d.items || []).map((t: any, i: number) => (
                <div key={i} className="p-6 bg-white rounded-2xl shadow-sm">
                  <div className="text-yellow-500 mb-2">{"★".repeat(t.rating || 5)}</div>
                  <p className="text-gray-700 mb-4 italic">"{t.text}"</p>
                  <p className="font-bold text-gray-900">— {t.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    case "faq":
      return (
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-12 text-gray-900">{d.title}</h2>
            <div className="space-y-4">
              {(d.items || []).map((item: any, i: number) => (
                <details key={i} className="p-6 rounded-2xl border-2 cursor-pointer" style={{ borderColor: secondary }}>
                  <summary className="font-bold text-gray-900">{item.question}</summary>
                  <p className="mt-3 text-gray-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      );
    case "cta":
      return (
        <section className="py-16 px-6" style={{ backgroundColor: primary }}>
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-5xl font-black mb-4">{d.title}</h2>
            <p className="text-xl mb-8">{d.subtitle}</p>
            {d.urgency && <p className="text-yellow-300 font-bold mb-6">{d.urgency}</p>}
            <button
              onClick={() => document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth" })}
              className="bg-white text-gray-900 px-10 py-5 rounded-xl text-lg font-black hover:scale-105 transition-transform"
            >
              {d.buttonText}
            </button>
          </div>
        </section>
      );
    case "stats":
      return (
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {(d.items || []).map((item: any, i: number) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-black mb-2" style={{ color: primary }}>{item.number}</div>
                <div className="text-sm text-gray-600 font-bold uppercase tracking-wide">{item.label}</div>
              </div>
            ))}
          </div>
        </section>
      );
    case "team":
      return (
        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-12 text-gray-900">{d.title}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {(d.members || []).map((m: any, i: number) => (
                <div key={i} className="p-6 bg-white rounded-2xl shadow-sm">
                  <h3 className="font-black text-xl mb-1" style={{ color: primary }}>{m.name}</h3>
                  <p className="text-sm font-bold text-gray-500 mb-2">{m.role}</p>
                  <p className="text-sm text-gray-600">{m.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    case "offer":
      return (
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto p-12 rounded-3xl text-center text-white shadow-2xl" style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}>
            <h2 className="text-2xl font-bold mb-2">{d.title}</h2>
            <div className="my-6">
              <span className="text-6xl md:text-7xl font-black">{d.price}</span>
              {d.originalPrice && <span className="text-xl line-through opacity-60 ml-3">{d.originalPrice}</span>}
            </div>
            <p className="text-xl mb-2">{d.description}</p>
            {d.deadline && <p className="text-yellow-300 font-bold">⏰ Scade il {d.deadline}</p>}
          </div>
        </section>
      );
    case "text":
      return (
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black mb-6 text-gray-900">{d.title}</h2>
            <p className="text-lg text-gray-700 leading-relaxed">{d.content}</p>
          </div>
        </section>
      );
    case "quiz":
      return (
        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-2xl mx-auto bg-white p-12 rounded-3xl shadow-xl text-center">
            <h2 className="text-3xl font-black mb-4 text-gray-900">{d.title}</h2>
            <p className="text-gray-600 mb-8">{d.description}</p>
            <button
              onClick={onStartQuiz}
              className="px-10 py-5 rounded-xl font-black text-white text-lg hover:scale-105 transition-transform"
              style={{ backgroundColor: primary }}
            >
              Inizia il quiz →
            </button>
          </div>
        </section>
      );
    case "lead_magnet_download":
      return (
        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-xl text-center">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-2xl font-black mb-4 text-gray-900">{d.title}</h2>
            <p className="text-gray-600 mb-6">{d.description}</p>
            <button
              onClick={() => document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-4 rounded-xl font-black text-white"
              style={{ backgroundColor: primary }}
            >
              Scarica gratis
            </button>
          </div>
        </section>
      );
    default:
      return null;
  }
};
