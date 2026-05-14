// =====================================================
// TIPI ESISTENTI (mantenuti per retrocompatibilità)
// =====================================================
export interface LandingSettings {
  hero_title: string;
  hero_subtitle: string;
  hero_date: string;
  hero_description: string;
  cta_text: string;
  hero_image: string;
  selected_images: string[];
}

export interface Question {
  id: number | string;
  text: string;
  type: string;
  options: string[];
}

// =====================================================
// FUNNEL & LANDING BUILDER - NUOVI TIPI
// =====================================================

export type FunnelLevel =
  | "lead_freddo"
  | "lead_tiepido"
  | "lead_caldo"
  | "urgenza"
  | "da_richiamare"
  | "solo_informativo"
  | "pronto_appuntamento"
  | "non_qualificato";

export const FUNNEL_LEVELS: { value: FunnelLevel; label: string; color: string }[] = [
  { value: "lead_freddo", label: "Lead Freddo", color: "#94a3b8" },
  { value: "lead_tiepido", label: "Lead Tiepido", color: "#fbbf24" },
  { value: "lead_caldo", label: "Lead Caldo", color: "#f97316" },
  { value: "urgenza", label: "Urgenza", color: "#dc2626" },
  { value: "da_richiamare", label: "Da Richiamare", color: "#8b5cf6" },
  { value: "solo_informativo", label: "Solo Informativo", color: "#06b6d4" },
  { value: "pronto_appuntamento", label: "Pronto Appuntamento", color: "#10b981" },
  { value: "non_qualificato", label: "Non Qualificato", color: "#6b7280" },
];

export type CampaignCategory =
  | "implantologia"
  | "igiene_dentale"
  | "ortodonzia_invisibile"
  | "sbiancamento"
  | "prima_visita"
  | "prevenzione"
  | "urgenze"
  | "informazione_gratuita";

export const CAMPAIGN_CATEGORIES: { value: CampaignCategory; label: string }[] = [
  { value: "implantologia", label: "Implantologia" },
  { value: "igiene_dentale", label: "Igiene Dentale" },
  { value: "ortodonzia_invisibile", label: "Ortodonzia Invisibile" },
  { value: "sbiancamento", label: "Sbiancamento Dentale" },
  { value: "prima_visita", label: "Prima Visita" },
  { value: "prevenzione", label: "Prevenzione" },
  { value: "urgenze", label: "Urgenze Dentistiche" },
  { value: "informazione_gratuita", label: "Informazione Gratuita" },
];

export type LandingTemplateType =
  | "vendita_diretta"
  | "informativa"
  | "quiz_diagnostico"
  | "offerta_promo"
  | "urgenza"
  | "autorevolezza"
  | "lead_magnet";

export const LANDING_TEMPLATES: { value: LandingTemplateType; label: string; description: string }[] = [
  { value: "vendita_diretta", label: "Vendita Diretta", description: "Far prenotare una visita o consulenza" },
  { value: "informativa", label: "Informativa", description: "Educare il paziente e poi richiesta info" },
  { value: "quiz_diagnostico", label: "Quiz Diagnostico", description: "Domande + qualificazione + prenotazione" },
  { value: "offerta_promo", label: "Offerta/Promozione", description: "Promozioni e offerte specifiche" },
  { value: "urgenza", label: "Urgenza", description: "Raccolta richieste urgenze dentistiche" },
  { value: "autorevolezza", label: "Autorevolezza", description: "Rafforzare fiducia nello studio" },
  { value: "lead_magnet", label: "Lead Magnet", description: "Scaricare guida o consigli gratuiti" },
];

export type ContentBlockType =
  | "hero"
  | "benefits"
  | "problem_solution"
  | "treatment"
  | "testimonials"
  | "faq"
  | "cta"
  | "form"
  | "quiz"
  | "team"
  | "gallery"
  | "video"
  | "text"
  | "stats"
  | "offer"
  | "lead_magnet_download";

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  order: number;
  visible: boolean;
  data: Record<string, any>;
}

export interface LandingPageDoc {
  id: string;
  internalName: string;
  slug: string;
  goal: string;
  category: CampaignCategory | string;
  templateType: LandingTemplateType;
  headline: string;
  subtitle: string;
  heroImage: string;
  heroVideo?: string;
  blocks: ContentBlock[];
  ctaText: string;
  formId?: string;
  funnelId?: string;
  thankYouPageId?: string;
  metaTitle?: string;
  metaDescription?: string;
  primaryColor?: string;
  secondaryColor?: string;
  status: "bozza" | "pubblicata" | "archiviata";
  // ----- Tracking pixel & analytics -----
  facebookPixelId?: string;             // ID Pixel Meta (es. "123456789012345")
  facebookPixelTestCode?: string;       // Test Event Code (opzionale, per test)
  googleTagId?: string;                 // GTM (GTM-XXXX) o GA4 (G-XXXXX)
  trackPageView?: boolean;
  trackFormSubmission?: boolean;
  trackBookingMade?: boolean;
  // ----- Recensioni -----
  reviewsEnabled?: boolean;
  reviewsShowGoogle?: boolean;          // Mostra recensioni da Google API
  reviewsShowManual?: boolean;          // Mostra recensioni manuali
  reviewsKeywordFilter?: string[];      // Filtro parole chiave (es: ["sbiancamento", "smile"])
  reviewsManualTags?: string[];         // Tag per filtrare recensioni manuali (es: ["sbiancamento"])
  reviewsMaxCount?: number;             // Quante mostrare (default 5)
  reviewsLayout?: "carousel" | "grid" | "list"; // Layout
  reviewsShowSummaryWidget?: boolean;   // Mostra widget "⭐ 4.8/5 su Google → leggi tutte"
  createdAt: string;
  updatedAt: string;
  views?: number;
  conversions?: number;
}

export interface Funnel {
  id: string;
  name: string;
  description?: string;
  goal: string;
  landingId?: string;
  initialLevel: FunnelLevel;
  startQuestionId?: string;
  formId?: string;
  thankYouPageId?: string;
  bookingEnabled: boolean;
  defaultTags: string[];
  automationIds: string[];
  status: "attivo" | "disattivato" | "bozza";
  createdAt: string;
  updatedAt: string;
}

export type QuestionType =
  | "single_choice"
  | "multi_choice"
  | "yes_no"
  | "text"
  | "number"
  | "date"
  | "phone"
  | "email";

export type AnswerActionType =
  | "next_question"
  | "go_to_form"
  | "go_to_thank_you"
  | "show_booking"
  | "assign_tag"
  | "assign_level"
  | "send_email"
  | "send_internal_notification"
  | "stop_flow"
  | "external_url";

export interface AnswerAction {
  type: AnswerActionType;
  nextQuestionId?: string;
  formId?: string;
  thankYouPageId?: string;
  tag?: string;
  funnelLevel?: FunnelLevel;
  emailTemplateId?: string;
  externalUrl?: string;
  notificationEmail?: string;
}

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
  actions: AnswerAction[];
}

export interface FunnelQuestion {
  id: string;
  text: string;
  description?: string;
  type: QuestionType;
  options: QuestionOption[];
  order: number;
  required: boolean;
  funnelId?: string;
  defaultActions?: AnswerAction[];
  createdAt: string;
}

export type FormFieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "time"
  | "number";

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  order: number;
}

export interface ContactForm {
  id: string;
  internalName: string;
  description?: string;
  fields: FormField[];
  privacyConsentRequired: boolean;
  marketingConsentEnabled: boolean;
  privacyText?: string;
  marketingText?: string;
  afterSubmitAction:
    | "show_thank_you"
    | "show_booking"
    | "redirect_url"
    | "show_message";
  thankYouPageId?: string;
  redirectUrl?: string;
  successMessage?: string;
  emailTemplateId?: string;
  internalNotificationEmail?: string;
  tagsToAssign: string[];
  funnelLevelToAssign?: FunnelLevel;
  createdAt: string;
}

export interface ThankYouPage {
  id: string;
  internalName: string;
  title: string;
  message: string;
  showBooking: boolean;
  showSocialShare: boolean;
  ctaText?: string;
  ctaUrl?: string;
  redirectUrl?: string;
  redirectDelaySeconds?: number;
  createdAt: string;
}

export interface BookingSlot {
  id: string;
  date: string;
  time: string;
  duration: number;
  maxBookings: number;
  currentBookings: number;
  appointmentType?: string;
  landingId?: string;
  funnelId?: string;
  status: "disponibile" | "pieno" | "disattivato";
  isBlocked: boolean;
  createdAt: string;
}

export type AutomationTriggerType =
  | "lead_created"
  | "form_submitted"
  | "answer_given"
  | "booking_made"
  | "booking_canceled"
  | "level_changed"
  | "tag_assigned"
  | "tag_added"
  | "manual_trigger";

export type AutomationActionType =
  | "send_email"
  | "show_thank_you"
  | "redirect_to_booking"
  | "assign_tag"
  | "assign_level"
  | "send_internal_email"
  | "send_whatsapp"
  | "save_lead"
  | "webhook";

export interface AutomationAction {
  id: string;
  type: AutomationActionType;
  config: Record<string, any>;
  delaySeconds?: number;
}

export interface Automation {
  id: string;
  name: string;
  description?: string;
  trigger: AutomationTriggerType;
  triggerConditions?: Record<string, any>;
  actions: AutomationAction[];
  enabled: boolean;
  createdAt: string;
}

export type LeadStatus =
  | "nuovo"
  | "da_contattare"
  | "contattato"
  | "appuntamento_prenotato"
  | "appuntamento_effettuato"
  | "non_risponde"
  | "non_interessato"
  | "convertito"
  | "archiviato";

export const LEAD_STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: "nuovo", label: "Nuovo", color: "#3b82f6" },
  { value: "da_contattare", label: "Da Contattare", color: "#f59e0b" },
  { value: "contattato", label: "Contattato", color: "#06b6d4" },
  { value: "appuntamento_prenotato", label: "Appuntamento Prenotato", color: "#8b5cf6" },
  { value: "appuntamento_effettuato", label: "Appuntamento Effettuato", color: "#10b981" },
  { value: "non_risponde", label: "Non Risponde", color: "#ef4444" },
  { value: "non_interessato", label: "Non Interessato", color: "#6b7280" },
  { value: "convertito", label: "Convertito", color: "#16a34a" },
  { value: "archiviato", label: "Archiviato", color: "#9ca3af" },
];

export interface LeadActionLog {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
  landingId?: string;
  landingName?: string;
  funnelId?: string;
  funnelName?: string;
  formId?: string;
  answers: Record<string, any>;
  formData: Record<string, any>;
  tags: string[];
  funnelLevel: FunnelLevel;
  status: LeadStatus;
  bookingSlotId?: string;
  bookingDate?: string;
  bookingTime?: string;
  thankYouPageViewed?: string;
  emailsSent: { templateId?: string; subject?: string; sentAt: string }[];
  notificationsSent: { type: string; sentAt: string }[];
  actionLog: LeadActionLog[];
  internalNotes?: string;
  privacyConsent: boolean;
  marketingConsent: boolean;
  acquiredAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  internalName: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  variables: string[];
  createdAt: string;
}

// =====================================================
// FLOW GRAPH (Funnel come grafo visuale - Fase A)
// =====================================================
export type FlowNodeType =
  | "trigger" | "landing" | "quiz_start" | "question" | "answer"
  | "form" | "booking" | "thank_you" | "condition" | "delay"
  | "action_email" | "action_tag" | "action_level" | "action_notify"
  | "action_webhook" | "exit" | "redirect" | "chat_ai";

export type FlowNodeCategory =
  | "trigger" | "content" | "interaction" | "conversion"
  | "logic" | "automation" | "exit";

export interface FlowPosition { x: number; y: number; }

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  position: FlowPosition;
  data: {
    label: string;
    description?: string;
    config: Record<string, any>;
    landingId?: string;
    formId?: string;
    questionId?: string;
    thankYouPageId?: string;
    chatBotId?: string;
    bookingSlotConfig?: Record<string, any>;
    stats?: { reached?: number; passed?: number; dropOff?: number; };
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  data?: { condition?: string; color?: string; };
}

export interface FlowFunnel {
  id: string;
  name: string;
  description?: string;
  goal: string;
  category?: CampaignCategory | string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  initialLevel: FunnelLevel;
  defaultTags: string[];
  status: "attivo" | "disattivato" | "bozza";
  createdAt: string;
  updatedAt: string;
  totalLeads?: number;
  conversionRate?: number;
}

export interface FlowNodeTypeDefinition {
  type: FlowNodeType;
  label: string;
  description: string;
  icon: string;
  category: FlowNodeCategory;
  color: string;
  borderColor: string;
  outputs: number;
  isStartNode?: boolean;
  isEndNode?: boolean;
  defaultConfig: () => Record<string, any>;
  defaultLabel: string;
}

// =====================================================
// CHAT AI BOT
// =====================================================
export type ChatToneOfVoice =
  | "professionale"
  | "amichevole"
  | "rassicurante"
  | "empatico"
  | "diretto";

export type ChatLeadClassification =
  | "freddo"
  | "tiepido"
  | "caldo"
  | "urgente";

/**
 * Configurazione di un singolo chatbot.
 * Ogni studio può avere più chatbot, uno per landing/servizio.
 */
export interface ChatBot {
  id: string;
  internalName: string;          // Es. "Chat Implantologia"
  enabled: boolean;
  // ----- Aspetto -----
  botName: string;               // Nome visibile (es. "Sofia")
  avatarUrl?: string;
  primaryColor?: string;
  position: "bottom-right" | "bottom-left";
  // ----- Comportamento -----
  initialMessage: string;        // Primo messaggio del bot
  welcomeQuickReplies?: string[]; // Bottoni di risposta rapida iniziali
  toneOfVoice: ChatToneOfVoice;
  systemPromptCustom?: string;   // Override del prompt base
  delaySeconds: number;          // Ritardo apertura
  autoOpen: boolean;             // Apertura automatica
  showOnMobile: boolean;
  // ----- Collegamenti business -----
  serviceContext?: string;       // Es. "implantologia", "ortodonzia invisibile"
  serviceDescription?: string;   // Descrizione del servizio per il prompt
  studioInfo?: string;           // Info sullo studio (orari, indirizzo, ecc.)
  faqs?: { q: string; a: string }[]; // FAQ usate dal bot
  // ----- CTA -----
  ctaBookingEnabled: boolean;
  ctaBookingLabel: string;       // "Prenota una visita"
  ctaBookingUrl?: string;        // Link interno o URL
  ctaFormEnabled: boolean;
  ctaFormLabel: string;          // "Lascia i tuoi dati"
  ctaFormId?: string;            // Modulo collegato
  // ----- Visibilità -----
  showOnLandingIds: string[];    // Quali landing mostrano la chat
  showOnAllLandings: boolean;
  // ----- Funzioni avanzate -----
  saveConversations: boolean;
  autoTagging: boolean;          // Assegna tag in base al contenuto
  leadScoring: boolean;          // Classifica lead caldo/freddo/urgente
  notifyOnLead: boolean;         // Notifica email quando si crea lead
  // ----- Linked entities -----
  funnelId?: string;
  // ----- Limiti -----
  maxMessagesPerSession: number;
  maxTokensPerResponse: number;
  // ----- Metadati -----
  createdAt: string;
  updatedAt: string;
  // ----- Statistiche denormalizzate -----
  totalConversations?: number;
  totalLeadsGenerated?: number;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

/**
 * Conversazione completa salvata in Firestore
 */
export interface ChatConversation {
  id: string;
  chatBotId: string;
  chatBotName: string;
  landingId?: string;
  landingName?: string;
  // ----- Dati visitatore (se raccolti) -----
  visitorFirstName?: string;
  visitorLastName?: string;
  visitorPhone?: string;
  visitorEmail?: string;
  // ----- Conversazione -----
  messages: ChatMessage[];
  // ----- Esito -----
  classification?: ChatLeadClassification;
  detectedTags: string[];
  detectedService?: string;
  detectedUrgency: boolean;
  ctaClicked?: "booking" | "form" | "none";
  leadCreated: boolean;
  leadId?: string;
  // ----- Tracking -----
  ipAddress?: string;
  userAgent?: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  // ----- Sessione browser (per ricongiungere) -----
  sessionId: string;
}

// =====================================================
// NOTIFICHE EMAIL INTERNE
// =====================================================
export type NotificationTriggerType =
  | "lead_created"
  | "form_submitted"
  | "chat_completed"
  | "chat_data_left"
  | "booking_made"
  | "lead_classified_hot"
  | "lead_classified_urgent"
  | "info_request"
  | "no_booking_data_left";

export interface NotificationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: NotificationTriggerType;
  // ----- Filtri (tutti opzionali, AND logico) -----
  filterFunnelId?: string;
  filterLandingId?: string;
  filterService?: string;
  filterFunnelLevel?: FunnelLevel;
  filterTags?: string[];
  // ----- Destinatari -----
  primaryRecipient: string;       // email
  ccRecipients?: string[];
  bccRecipients?: string[];
  // ----- Template -----
  emailSubject: string;           // Es. "Nuova lead da {{landing}}"
  emailBody: string;              // Body con placeholders {{nome}}, {{telefono}}, ...
  emailFormat: "html" | "text";
  // ----- Throttling -----
  cooldownMinutes?: number;       // Non inviare più di una volta ogni N minuti per lo stesso lead
  // ----- Metadati -----
  createdAt: string;
  updatedAt: string;
}

/**
 * Storico delle email di notifica inviate
 */
export interface NotificationLog {
  id: string;
  ruleId: string;
  ruleName: string;
  trigger: NotificationTriggerType;
  recipients: string[];
  subject: string;
  bodyPreview: string;            // Prime ~200 char del body
  status: "sent" | "failed" | "queued" | "stub";
  errorMessage?: string;
  // ----- Riferimenti -----
  leadId?: string;
  landingId?: string;
  funnelId?: string;
  conversationId?: string;
  // ----- Provider -----
  provider: "resend" | "stub";
  providerMessageId?: string;
  // ----- Timing -----
  sentAt: string;
}

// =====================================================
// IMPOSTAZIONI GLOBALI APP (API Keys, Provider, ecc.)
// =====================================================
export interface AppSettings {
  id: "global";                   // documento singleton
  // ----- AI Provider -----
  aiProvider?: "anthropic" | "gemini";    // default: "gemini" (gratis)
  // Anthropic (Claude)
  anthropicApiKey?: string;       // Salvato in Firestore, letto solo server-side
  anthropicModel?: string;        // default: "claude-haiku-4-5-20251001"
  // Google Gemini (gratis con limiti)
  geminiApiKey?: string;
  geminiModel?: string;           // default: "gemini-2.0-flash-exp"
  // ----- Email Provider -----
  resendApiKey?: string;
  emailFromName?: string;         // "Studio Dentistico XYZ"
  emailFromAddress?: string;      // "noreply@studiodentistico.it"
  emailReplyTo?: string;
  // ----- Google Places (per recensioni Google) -----
  googlePlacesApiKey?: string;
  googlePlaceId?: string;         // ID dello studio su Google Maps
  // ----- Tracking globale (oltre quello per-landing) -----
  globalFacebookPixelId?: string; // Pixel valido per tutte le landing (override per landing)
  globalGoogleTagId?: string;
  // ----- Studio Info (usato dalla chat e nelle email) -----
  studioName?: string;
  studioAddress?: string;
  studioPhone?: string;
  studioEmail?: string;
  studioWebsite?: string;
  studioOpeningHours?: string;
  // ----- Branding -----
  brandPrimaryColor?: string;
  brandLogoUrl?: string;
  // ----- Privacy -----
  defaultPrivacyText?: string;
  defaultMarketingText?: string;
  // ----- Dashboard URL (per i link nelle email) -----
  dashboardBaseUrl?: string;      // Es. "https://miosito.com"
  // ----- Feature flags -----
  chatGloballyEnabled: boolean;
  notificationsGloballyEnabled: boolean;
  // ----- Metadati -----
  updatedAt: string;
}


// =====================================================
// EMAIL TEMPLATES (riusabili per automation + broadcast)
// =====================================================
export type EmailTemplateCategory =
  | "benvenuto"
  | "promemoria"
  | "follow_up"
  | "marketing"
  | "transazionale"
  | "altro";

export interface EmailTemplateV2 {
  id: string;
  internalName: string;
  category: EmailTemplateCategory;
  subject: string;
  // Modalità di editing
  editorMode: "simple" | "html";
  // Per modalità simple
  bodyText?: string;          // Testo principale (markdown-like, link automatici)
  ctaButtonLabel?: string;    // Bottone "Prenota ora", ecc.
  ctaButtonUrl?: string;
  // Per modalità HTML
  bodyHtml?: string;
  // Branding
  headerImageUrl?: string;
  footerText?: string;
  // Variabili dichiarate (per validazione)
  variablesUsed?: string[];
  // Metadati
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// EMAIL AUTOMATION (sequenze automatiche post-evento)
// =====================================================
export type AutomationStepDelay = "immediate" | "minutes" | "hours" | "days";

export interface AutomationStep {
  id: string;
  order: number;            // ordine sequenziale (0, 1, 2, ...)
  // Quando inviare
  delayType: AutomationStepDelay;
  delayValue: number;       // 0 se immediate
  // Cosa inviare
  templateId: string;
  // Condizioni opzionali per saltare lo step
  skipIfTagPresent?: string[];      // Salta se il lead ha questi tag
  skipIfLevelIs?: string[];         // Salta se è già a livello X
  skipIfBookingMade?: boolean;      // Salta se ha già prenotato
  // Modifiche al lead dopo invio
  addTagsAfterSend?: string[];
  changeLevelAfterSend?: string;
}

export interface EmailAutomation {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  // Trigger
  trigger: AutomationTriggerType;
  triggerTagFilter?: string;        // Per "tag_added"
  // Filtri opzionali (chi entra in questa automation)
  filterLandingId?: string;
  filterFunnelId?: string;
  filterService?: string;
  filterFunnelLevel?: FunnelLevel;
  filterTags?: string[];
  // Steps (sequenza email)
  steps: AutomationStep[];
  // Stats (denormalizzate)
  totalEnrolled?: number;
  totalCompleted?: number;
  // Metadati
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// AUTOMATION ENROLLMENT (lead "iscritti" a una sequenza)
// =====================================================
export type EnrollmentStatus = "active" | "completed" | "exited" | "failed";

export interface AutomationEnrollment {
  id: string;
  automationId: string;
  leadId: string;
  status: EnrollmentStatus;
  // Progresso
  currentStepOrder: number;       // -1 = appena iscritto, 0 = primo step inviato
  nextScheduledAt?: string;       // ISO datetime quando inviare il prossimo step
  // Storico
  stepsCompleted: {
    stepId: string;
    sentAt: string;
    skipped?: boolean;
    skipReason?: string;
  }[];
  // Exit/completion
  enrolledAt: string;
  completedAt?: string;
  exitedAt?: string;
  exitReason?: string;
}

// =====================================================
// BROADCAST CAMPAIGNS (email marketing manuali)
// =====================================================
export type BroadcastStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";

export interface BroadcastCampaign {
  id: string;
  name: string;
  description?: string;
  status: BroadcastStatus;
  // Contenuto
  templateId?: string;            // Se usa un template esistente
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  editorMode: "simple" | "html";
  ctaButtonLabel?: string;
  ctaButtonUrl?: string;
  // Audience: filtri per selezione lead
  audienceFilters: {
    landingIds?: string[];
    funnelIds?: string[];
    services?: string[];
    funnelLevels?: FunnelLevel[];
    tags?: string[];
    statuses?: LeadStatus[];
    marketingConsentRequired: boolean;  // Default true (GDPR)
    excludeUnsubscribed: boolean;       // Default true
  };
  // Lead esplicitamente inclusi/esclusi (override)
  manuallyIncludedLeadIds?: string[];
  manuallyExcludedLeadIds?: string[];
  // Calcolato al momento dell'invio
  estimatedRecipients?: number;
  actualRecipients?: number;
  // Scheduling
  scheduledAt?: string;           // Se scheduled
  sentAt?: string;
  // Stats
  totalSent?: number;
  totalDelivered?: number;
  totalOpened?: number;
  totalClicked?: number;
  totalFailed?: number;
  // Metadati
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// EMAIL EVENT TRACKING (aperture, click, ecc.)
// =====================================================
export type EmailEventType = "sent" | "delivered" | "opened" | "clicked" | "bounced" | "complained" | "unsubscribed";

export interface EmailEvent {
  id: string;
  // Riferimenti
  leadId: string;
  emailType: "automation" | "broadcast" | "notification";
  automationId?: string;
  enrollmentId?: string;
  broadcastId?: string;
  templateId?: string;
  // Provider
  providerMessageId?: string;     // ID Resend
  // Evento
  eventType: EmailEventType;
  eventData?: Record<string, any>;  // Payload del webhook (es. URL cliccato)
  occurredAt: string;
}

// =====================================================
// ANALYTICS (snapshot/cache per performance)
// =====================================================
export interface AnalyticsSnapshot {
  id: string;
  // Periodo
  periodStart: string;          // ISO date
  periodEnd: string;
  granularity: "day" | "week" | "month";
  // Metriche
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;       // tiepido + caldo + urgente
  bookings: number;
  // Per source
  leadsByLanding: Record<string, number>;
  leadsByFunnel: Record<string, number>;
  leadsByService: Record<string, number>;
  leadsByLevel: Record<string, number>;
  // Conversioni
  visitToLeadRate?: number;     // % (se abbiamo tracking visite)
  leadToBookingRate?: number;
  // Email stats
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  // Tempi
  avgTimeToFirstResponse?: number;
  computedAt: string;
}

// =====================================================
// RECENSIONI MANUALI (archivio gestito da dashboard)
// =====================================================
export interface ManualReview {
  id: string;
  authorName: string;
  authorPhoto?: string;            // URL avatar (opzionale)
  text: string;
  rating: number;                  // 1-5
  reviewDate?: string;             // ISO date (es. "2025-04-15") — quando l'ha lasciata
  serviceTags: string[];           // Es: ["sbiancamento", "implantologia"]
  source?: "google" | "whatsapp" | "email" | "instagram" | "verbale" | "altro";
  sourceUrl?: string;              // Link alla recensione originale (Google ecc.)
  verified?: boolean;              // Es. "verificata da paziente reale"
  visible: boolean;                // Pubblicata o nascosta
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// CACHE RECENSIONI GOOGLE (per evitare chiamate API ripetute)
// =====================================================
export interface GoogleReviewItem {
  authorName: string;
  authorPhotoUrl?: string;
  rating: number;                  // 1-5
  text: string;
  relativeTime: string;            // "2 mesi fa", "1 anno fa"
  time: number;                    // Unix timestamp
  language?: string;
}

export interface GoogleReviewsCache {
  id: string;                      // Es. "global" (singleton per studio)
  placeId: string;
  studioName?: string;
  totalRatings?: number;           // Totale stelline
  averageRating?: number;          // 4.8
  reviews: GoogleReviewItem[];     // Le 5 dell'API
  googleMapsUrl?: string;          // Link allo studio su Google Maps
  cachedAt: string;                // ISO datetime quando aggiornato
  ttlHours?: number;               // Validità cache (default 24h)
}

// =====================================================
// EVENTI TRACKING (per analytics + integrazione pixel)
// =====================================================
export type TrackedEventName =
  | "PageView"
  | "Lead"               // Form compilato
  | "Schedule"           // Booking fatto
  | "CompleteRegistration"
  | "Contact"            // Click su telefono/email/chat
  | "ViewContent"        // Visita pagina specifica
  | "CustomEvent";

export interface TrackedEvent {
  name: TrackedEventName;
  parameters?: Record<string, any>;
  landingId?: string;
  funnelId?: string;
  leadId?: string;
}
