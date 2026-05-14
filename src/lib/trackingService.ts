/**
 * Servizio tracking lato client.
 *
 * Si occupa di:
 * - Inizializzare Facebook Pixel quando la landing è caricata
 * - Inizializzare Google Tag Manager / GA4
 * - Inviare eventi (PageView, Lead, Schedule, Contact, ecc.)
 *
 * Usato in: DynamicLandingPage e nei vari handler eventi.
 */

import type { TrackedEventName, LandingPageDoc, AppSettings } from "../types";

declare global {
  interface Window {
    fbq?: any;
    dataLayer?: any[];
    gtag?: any;
    _fbq_initialized?: Set<string>;
    _gtm_initialized?: Set<string>;
  }
}

// =====================================================
// FACEBOOK PIXEL
// =====================================================

/**
 * Carica lo script Facebook Pixel se non già caricato.
 */
export function initFacebookPixel(pixelId: string, testCode?: string) {
  if (typeof window === "undefined" || !pixelId) return;
  // Già inizializzato? Evita doppio injection
  if (!window._fbq_initialized) window._fbq_initialized = new Set();
  if (window._fbq_initialized.has(pixelId)) return;
  window._fbq_initialized.add(pixelId);

  // Standard FB Pixel snippet
  (function(f: any, b: any, e: any, v: any) {
    if (f.fbq) return;
    const n: any = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e);
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  window.fbq("init", pixelId);
  if (testCode) {
    window.fbq("set", "autoConfig", "false", pixelId);
  }
}

/**
 * Invia un evento al Facebook Pixel.
 */
export function trackFacebookEvent(eventName: string, parameters?: Record<string, any>) {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    if (parameters) {
      window.fbq("track", eventName, parameters);
    } else {
      window.fbq("track", eventName);
    }
  } catch (e) {
    console.warn("FB Pixel track error:", e);
  }
}

// =====================================================
// GOOGLE TAG MANAGER / GA4
// =====================================================

/**
 * Carica GTM o GA4 in base al formato dell'ID.
 */
export function initGoogleTag(tagId: string) {
  if (typeof window === "undefined" || !tagId) return;
  if (!window._gtm_initialized) window._gtm_initialized = new Set();
  if (window._gtm_initialized.has(tagId)) return;
  window._gtm_initialized.add(tagId);

  // GTM-XXXX → Google Tag Manager
  if (tagId.startsWith("GTM-")) {
    (function(w: any, d: any, s: any, l: any, i: any) {
      w[l] = w[l] || [];
      w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      const f = d.getElementsByTagName(s)[0];
      const j: any = d.createElement(s);
      const dl = l !== "dataLayer" ? "&l=" + l : "";
      j.async = true;
      j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, "script", "dataLayer", tagId);
  } else if (tagId.startsWith("G-") || tagId.startsWith("UA-") || tagId.startsWith("AW-")) {
    // GA4 (G-XXXX), Universal (UA-XXXX), Ads (AW-XXXX)
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${tagId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer!.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", tagId);
  }
}

/**
 * Invia un evento a GA4/GTM.
 */
export function trackGoogleEvent(eventName: string, parameters?: Record<string, any>) {
  if (typeof window === "undefined") return;
  try {
    if (window.gtag) {
      window.gtag("event", eventName, parameters || {});
    } else if (window.dataLayer) {
      window.dataLayer.push({ event: eventName, ...parameters });
    }
  } catch (e) {
    console.warn("Google tag track error:", e);
  }
}

// =====================================================
// API UNIFICATA — usata dai componenti
// =====================================================

/**
 * Inizializza pixel + google tag dalla landing (e da settings globali se non override).
 */
export function initTrackingForLanding(landing: LandingPageDoc, settings?: Partial<AppSettings>) {
  const pixelId = landing.facebookPixelId || settings?.globalFacebookPixelId;
  const gtagId = landing.googleTagId || settings?.globalGoogleTagId;

  if (pixelId) initFacebookPixel(pixelId, landing.facebookPixelTestCode);
  if (gtagId) initGoogleTag(gtagId);

  // PageView automatica (se non disabilitata)
  if (landing.trackPageView !== false) {
    trackEvent("PageView", { landing_id: landing.id, landing_name: landing.internalName });
  }
}

/**
 * Invia un evento sia a FB Pixel sia a Google Tag.
 * Map degli eventi standard:
 * - "PageView"           → fbq("track", "PageView")           + gtag("event", "page_view")
 * - "Lead"               → fbq("track", "Lead")               + gtag("event", "generate_lead")
 * - "Schedule"           → fbq("track", "Schedule")           + gtag("event", "schedule")
 * - "CompleteRegistration" → fbq("track", "CompleteRegistration") + gtag("event", "sign_up")
 * - "Contact"            → fbq("track", "Contact")            + gtag("event", "contact")
 * - "ViewContent"        → fbq("track", "ViewContent")        + gtag("event", "view_content")
 */
export function trackEvent(name: TrackedEventName, parameters?: Record<string, any>) {
  // Facebook Pixel: usa il nome standard FB
  trackFacebookEvent(name, parameters);

  // Google: mappa al nome standard GA
  const gaName = mapToGAEvent(name);
  trackGoogleEvent(gaName, parameters);
}

function mapToGAEvent(fbName: TrackedEventName): string {
  switch (fbName) {
    case "PageView": return "page_view";
    case "Lead": return "generate_lead";
    case "Schedule": return "schedule";
    case "CompleteRegistration": return "sign_up";
    case "Contact": return "contact";
    case "ViewContent": return "view_content";
    case "CustomEvent": return "custom_event";
  }
}
