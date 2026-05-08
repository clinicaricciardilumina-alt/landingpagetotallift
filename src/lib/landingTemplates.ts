import type { ContentBlock, LandingTemplateType } from "../types";

const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

export interface LandingTemplateDefinition {
  type: LandingTemplateType;
  name: string;
  description: string;
  defaultHeadline: string;
  defaultSubtitle: string;
  defaultCta: string;
  primaryColor: string;
  secondaryColor: string;
  blocks: () => ContentBlock[];
}

// =====================================================
// 1. VENDITA DIRETTA
// =====================================================
const venditaDiretta: LandingTemplateDefinition = {
  type: "vendita_diretta",
  name: "Vendita Diretta",
  description: "Far prenotare una visita o consulenza con CTA forte",
  defaultHeadline: "Riconquista il sorriso che meriti",
  defaultSubtitle: "Prima visita gratuita con i nostri specialisti",
  defaultCta: "Prenota ora la tua visita gratuita",
  primaryColor: "#0066A1",
  secondaryColor: "#96C8E6",
  blocks: () => [
    {
      id: uid("blk"),
      type: "problem_solution",
      order: 1,
      visible: true,
      data: {
        problemTitle: "Hai un problema dentale che ti preoccupa?",
        problemText: "Dolore, denti mancanti, sorriso che non ti piace... questi problemi non spariscono da soli.",
        solutionTitle: "Oggi esiste una soluzione",
        solutionText: "Il nostro studio offre trattamenti su misura, indolori e con tecnologie all'avanguardia.",
      },
    },
    {
      id: uid("blk"),
      type: "treatment",
      order: 2,
      visible: true,
      data: {
        title: "Il trattamento",
        description: "Spiegazione del trattamento principale offerto",
        steps: [
          { title: "Visita gratuita", description: "Diagnosi completa senza impegno" },
          { title: "Piano personalizzato", description: "Soluzione su misura per te" },
          { title: "Trattamento", description: "Eseguito con tecniche moderne" },
          { title: "Controlli", description: "Follow-up post trattamento" },
        ],
      },
    },
    {
      id: uid("blk"),
      type: "benefits",
      order: 3,
      visible: true,
      data: {
        title: "I tuoi vantaggi",
        items: [
          { icon: "✓", title: "Prima visita gratuita", description: "Senza alcun impegno" },
          { icon: "✓", title: "Tecnologia all'avanguardia", description: "Strumenti di ultima generazione" },
          { icon: "✓", title: "Pagamenti rateali", description: "Soluzioni flessibili" },
          { icon: "✓", title: "Equipe specializzata", description: "Professionisti qualificati" },
        ],
      },
    },
    {
      id: uid("blk"),
      type: "testimonials",
      order: 4,
      visible: true,
      data: {
        title: "Cosa dicono i nostri pazienti",
        items: [
          { name: "Maria R.", text: "Esperienza eccellente, professionalità impeccabile.", rating: 5 },
          { name: "Giovanni B.", text: "Mi hanno fatto sentire a casa. Risultato perfetto.", rating: 5 },
          { name: "Laura C.", text: "Finalmente posso sorridere senza vergognarmi!", rating: 5 },
        ],
      },
    },
    {
      id: uid("blk"),
      type: "cta",
      order: 5,
      visible: true,
      data: {
        title: "Non aspettare ancora",
        subtitle: "Prenota la tua visita gratuita oggi stesso",
        buttonText: "Prenota la visita gratuita",
        urgency: "Posti limitati questa settimana",
      },
    },
    {
      id: uid("blk"),
      type: "form",
      order: 6,
      visible: true,
      data: { title: "Compila il form e ti richiameremo entro 24h" },
    },
  ],
};

// =====================================================
// 2. INFORMATIVA
// =====================================================
const informativa: LandingTemplateDefinition = {
  type: "informativa",
  name: "Informativa",
  description: "Educare il paziente e portarlo alla richiesta info",
  defaultHeadline: "Tutto quello che devi sapere prima di scegliere",
  defaultSubtitle: "Una guida chiara, semplice, senza tecnicismi",
  defaultCta: "Ricevi maggiori informazioni",
  primaryColor: "#06b6d4",
  secondaryColor: "#a5f3fc",
  blocks: () => [
    {
      id: uid("blk"),
      type: "text",
      order: 1,
      visible: true,
      data: {
        title: "Una spiegazione semplice",
        content: "Vogliamo che tu capisca perfettamente di cosa si tratta, senza giri di parole. Ecco cosa devi sapere...",
      },
    },
    {
      id: uid("blk"),
      type: "faq",
      order: 2,
      visible: true,
      data: {
        title: "Falsi miti e verità",
        items: [
          { question: "È un trattamento doloroso?", answer: "No, le tecniche moderne lo rendono confortevole." },
          { question: "Quanto dura?", answer: "Dipende dal caso, ma in media tra 1 e 3 sedute." },
          { question: "Quanto costa?", answer: "Offriamo preventivi personalizzati e gratuiti." },
          { question: "Ci sono effetti collaterali?", answer: "Minimi e temporanei, te li spiegheremo nel dettaglio." },
        ],
      },
    },
    {
      id: uid("blk"),
      type: "text",
      order: 3,
      visible: true,
      data: {
        title: "Quando serve davvero?",
        content: "Ti spieghiamo i casi in cui questo trattamento è realmente indicato per te, senza forzature.",
      },
    },
    {
      id: uid("blk"),
      type: "benefits",
      order: 4,
      visible: true,
      data: {
        title: "Vantaggi reali",
        items: [
          { icon: "📚", title: "Informazioni complete", description: "Tutto ciò che ti serve" },
          { icon: "🤝", title: "Senza impegno", description: "Solo informazione, niente pressioni" },
          { icon: "⏰", title: "Tempi tuoi", description: "Decidi quando contattarci" },
        ],
      },
    },
    {
      id: uid("blk"),
      type: "cta",
      order: 5,
      visible: true,
      data: {
        title: "Vuoi saperne di più?",
        subtitle: "Compila il form e riceverai informazioni dettagliate",
        buttonText: "Voglio maggiori informazioni",
      },
    },
    { id: uid("blk"), type: "form", order: 6, visible: true, data: {} },
  ],
};

// =====================================================
// 3. QUIZ DIAGNOSTICO
// =====================================================
const quizDiagnostico: LandingTemplateDefinition = {
  type: "quiz_diagnostico",
  name: "Quiz Diagnostico",
  description: "Domande + qualificazione + prenotazione",
  defaultHeadline: "Scopri qual è la soluzione giusta per te",
  defaultSubtitle: "Rispondi a 4 domande e ricevi una valutazione personalizzata",
  defaultCta: "Inizia il quiz gratuito",
  primaryColor: "#8b5cf6",
  secondaryColor: "#ddd6fe",
  blocks: () => [
    {
      id: uid("blk"),
      type: "text",
      order: 1,
      visible: true,
      data: {
        title: "Come funziona",
        content: "Rispondi a poche domande semplici. In meno di 2 minuti riceverai una valutazione iniziale e ti diremo se possiamo aiutarti.",
      },
    },
    {
      id: uid("blk"),
      type: "quiz",
      order: 2,
      visible: true,
      data: {
        title: "Inizia il tuo quiz",
        description: "Le tue risposte sono riservate e ci aiutano a darti la valutazione più accurata.",
      },
    },
    {
      id: uid("blk"),
      type: "benefits",
      order: 3,
      visible: true,
      data: {
        title: "Perché fare il quiz?",
        items: [
          { icon: "🎯", title: "Valutazione personalizzata", description: "Risposte basate sul tuo caso" },
          { icon: "🆓", title: "100% gratuito", description: "Nessun costo nascosto" },
          { icon: "⚡", title: "Risultato immediato", description: "In meno di 2 minuti" },
        ],
      },
    },
  ],
};

// =====================================================
// 4. OFFERTA / PROMOZIONE
// =====================================================
const offertaPromo: LandingTemplateDefinition = {
  type: "offerta_promo",
  name: "Offerta / Promozione",
  description: "Promozioni e offerte specifiche con scadenza",
  defaultHeadline: "Igiene Dentale a 49€ — Solo questo mese",
  defaultSubtitle: "Offerta esclusiva valida fino al 30 del mese",
  defaultCta: "Prenota ora a 49€",
  primaryColor: "#dc2626",
  secondaryColor: "#fecaca",
  blocks: () => [
    {
      id: uid("blk"),
      type: "offer",
      order: 1,
      visible: true,
      data: {
        title: "Offerta limitata",
        price: "49€",
        originalPrice: "89€",
        deadline: "30/05/2025",
        description: "Igiene dentale professionale completa",
      },
    },
    {
      id: uid("blk"),
      type: "benefits",
      order: 2,
      visible: true,
      data: {
        title: "Cosa è incluso",
        items: [
          { icon: "✓", title: "Pulizia profonda", description: "Rimozione tartaro e placca" },
          { icon: "✓", title: "Sbiancamento leggero", description: "Lucidatura finale" },
          { icon: "✓", title: "Visita di controllo", description: "Diagnosi completa" },
          { icon: "✓", title: "Consigli personalizzati", description: "Per la tua igiene quotidiana" },
        ],
      },
    },
    {
      id: uid("blk"),
      type: "testimonials",
      order: 3,
      visible: true,
      data: {
        title: "Pazienti soddisfatti",
        items: [
          { name: "Antonio M.", text: "Servizio eccellente al miglior prezzo!", rating: 5 },
          { name: "Sara P.", text: "Sono tornato dopo anni e mi sono trovato benissimo.", rating: 5 },
        ],
      },
    },
    {
      id: uid("blk"),
      type: "cta",
      order: 4,
      visible: true,
      data: {
        title: "Approfitta subito",
        subtitle: "Posti limitati per garantire la qualità del servizio",
        buttonText: "Prenota a 49€",
        urgency: "⏰ Offerta valida fino al 30 del mese",
      },
    },
    { id: uid("blk"), type: "form", order: 5, visible: true, data: {} },
  ],
};

// =====================================================
// 5. URGENZA
// =====================================================
const urgenza: LandingTemplateDefinition = {
  type: "urgenza",
  name: "Urgenza",
  description: "Raccolta richieste urgenze dentistiche",
  defaultHeadline: "Hai un'urgenza dentale? Siamo qui",
  defaultSubtitle: "Risposta entro 30 minuti, anche oggi",
  defaultCta: "Chiama subito",
  primaryColor: "#dc2626",
  secondaryColor: "#fee2e2",
  blocks: () => [
    {
      id: uid("blk"),
      type: "text",
      order: 1,
      visible: true,
      data: {
        title: "Stiamo accettando urgenze oggi",
        content: "Se hai dolore acuto, un dente rotto o un'infezione, non aspettare. Ti riceviamo nel più breve tempo possibile.",
      },
    },
    {
      id: uid("blk"),
      type: "benefits",
      order: 2,
      visible: true,
      data: {
        title: "Sintomi che richiedono urgenza",
        items: [
          { icon: "🚨", title: "Dolore intenso", description: "Soprattutto notturno" },
          { icon: "🚨", title: "Gonfiore facciale", description: "Possibile infezione" },
          { icon: "🚨", title: "Trauma dentale", description: "Dente rotto o caduto" },
          { icon: "🚨", title: "Sanguinamento", description: "Persistente o abbondante" },
        ],
      },
    },
    {
      id: uid("blk"),
      type: "cta",
      order: 3,
      visible: true,
      data: {
        title: "Contattaci adesso",
        subtitle: "Compila il form veloce, ti richiameremo entro 30 minuti",
        buttonText: "Richiedi assistenza urgente",
      },
    },
    { id: uid("blk"), type: "form", order: 4, visible: true, data: { title: "Form urgenza" } },
  ],
};

// =====================================================
// 6. AUTOREVOLEZZA
// =====================================================
const autorevolezza: LandingTemplateDefinition = {
  type: "autorevolezza",
  name: "Autorevolezza",
  description: "Rafforzare fiducia nello studio",
  defaultHeadline: "30 anni di esperienza al servizio del tuo sorriso",
  defaultSubtitle: "Studio dentistico di riferimento sul territorio",
  defaultCta: "Conoscici dal vivo",
  primaryColor: "#1e40af",
  secondaryColor: "#dbeafe",
  blocks: () => [
    {
      id: uid("blk"),
      type: "text",
      order: 1,
      visible: true,
      data: {
        title: "La nostra storia",
        content: "Dal 1995 ci dedichiamo alla salute orale dei nostri pazienti, con un approccio umano e tecnologie all'avanguardia.",
      },
    },
    {
      id: uid("blk"),
      type: "stats",
      order: 2,
      visible: true,
      data: {
        items: [
          { number: "30+", label: "Anni di esperienza" },
          { number: "10.000+", label: "Pazienti soddisfatti" },
          { number: "15", label: "Specialisti dedicati" },
          { number: "4.9★", label: "Recensioni Google" },
        ],
      },
    },
    {
      id: uid("blk"),
      type: "team",
      order: 3,
      visible: true,
      data: {
        title: "Il nostro team",
        members: [
          { name: "Dr. Mario Rossi", role: "Direttore sanitario", bio: "Specialista in implantologia" },
          { name: "Dr.ssa Laura Bianchi", role: "Ortodonzista", bio: "Esperta in ortodonzia invisibile" },
        ],
      },
    },
    {
      id: uid("blk"),
      type: "benefits",
      order: 4,
      visible: true,
      data: {
        title: "Tecnologie all'avanguardia",
        items: [
          { icon: "🔬", title: "Radiografia 3D", description: "Diagnosi precise" },
          { icon: "💎", title: "Chirurgia laser", description: "Tecniche minimamente invasive" },
          { icon: "🦷", title: "Stampa 3D dentale", description: "Protesi personalizzate" },
          { icon: "📱", title: "Cartella digitale", description: "Storico sempre disponibile" },
        ],
      },
    },
    {
      id: uid("blk"),
      type: "testimonials",
      order: 5,
      visible: true,
      data: {
        title: "Storie di pazienti",
        items: [
          { name: "Famiglia Verdi", text: "Da 15 anni ci affidiamo a loro. Sempre impeccabili.", rating: 5 },
          { name: "Roberto T.", text: "Tecnologia avanzata, spiegata con semplicità.", rating: 5 },
          { name: "Carla M.", text: "Mi hanno restituito il sorriso. Grazie!", rating: 5 },
        ],
      },
    },
    {
      id: uid("blk"),
      type: "cta",
      order: 6,
      visible: true,
      data: {
        title: "Vieni a conoscerci",
        subtitle: "Prenota la tua prima visita conoscitiva",
        buttonText: "Prenota una visita",
      },
    },
    { id: uid("blk"), type: "form", order: 7, visible: true, data: {} },
  ],
};

// =====================================================
// 7. LEAD MAGNET
// =====================================================
const leadMagnet: LandingTemplateDefinition = {
  type: "lead_magnet",
  name: "Lead Magnet",
  description: "Scaricare guida o consigli gratuiti",
  defaultHeadline: "Scarica la guida gratuita: 7 errori da evitare per il tuo sorriso",
  defaultSubtitle: "Una guida pratica scritta dai nostri specialisti, scaricala subito",
  defaultCta: "Scarica la guida gratis",
  primaryColor: "#10b981",
  secondaryColor: "#d1fae5",
  blocks: () => [
    {
      id: uid("blk"),
      type: "text",
      order: 1,
      visible: true,
      data: {
        title: "Cosa contiene la guida",
        content: "20 pagine di consigli pratici, basati su 30 anni di esperienza clinica. Senza tecnicismi, scritto per essere capito da tutti.",
      },
    },
    {
      id: uid("blk"),
      type: "benefits",
      order: 2,
      visible: true,
      data: {
        title: "Perché ti sarà utile",
        items: [
          { icon: "📖", title: "20 pagine pratiche", description: "Consigli applicabili subito" },
          { icon: "🦷", title: "7 errori comuni", description: "Da evitare assolutamente" },
          { icon: "✨", title: "Routine ideale", description: "Per un sorriso sano" },
          { icon: "🎁", title: "Gratis", description: "Senza alcun costo" },
        ],
      },
    },
    {
      id: uid("blk"),
      type: "lead_magnet_download",
      order: 3,
      visible: true,
      data: {
        title: "Scarica subito la guida",
        description: "Inserisci la tua email per ricevere il PDF immediatamente",
        fileLabel: "guida_sorriso_sano.pdf",
      },
    },
    {
      id: uid("blk"),
      type: "testimonials",
      order: 4,
      visible: true,
      data: {
        title: "Cosa dice chi l'ha scaricata",
        items: [
          { name: "Marco F.", text: "Consigli semplici ma efficaci. Bella scoperta!", rating: 5 },
          { name: "Elena B.", text: "Finalmente qualcuno che spiega in modo chiaro.", rating: 5 },
        ],
      },
    },
  ],
};

// =====================================================
// EXPORT
// =====================================================
export const LANDING_TEMPLATE_DEFINITIONS: Record<LandingTemplateType, LandingTemplateDefinition> = {
  vendita_diretta: venditaDiretta,
  informativa: informativa,
  quiz_diagnostico: quizDiagnostico,
  offerta_promo: offertaPromo,
  urgenza: urgenza,
  autorevolezza: autorevolezza,
  lead_magnet: leadMagnet,
};

export const getTemplateDefinition = (type: LandingTemplateType): LandingTemplateDefinition => {
  return LANDING_TEMPLATE_DEFINITIONS[type];
};
