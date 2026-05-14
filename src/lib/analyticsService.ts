import type { Lead, BookingSlot, EmailEvent, FunnelLevel } from "../types";
import { calculateMetrics } from "./emailEventService";

// =====================================================
// DATE HELPERS
// =====================================================
export const startOfDay = (d: Date): Date => {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
};
export const startOfWeek = (d: Date): Date => {
  const x = startOfDay(d);
  const day = x.getDay() || 7;
  x.setDate(x.getDate() - (day - 1));
  return x;
};
export const startOfMonth = (d: Date): Date => {
  const x = startOfDay(d); x.setDate(1); return x;
};
export const formatDateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// =====================================================
// CORE METRICS
// =====================================================
export interface OverviewMetrics {
  totalLeads: number;
  newLeads: number;          // ultime 24h
  weekLeads: number;
  monthLeads: number;
  qualifiedLeads: number;    // tiepido + caldo + urgente
  hotLeads: number;          // caldo + urgente
  conversions: number;       // status = chiuso_positivo
  conversionRate: number;    // %
  avgLeadsPerDay: number;
}

export const computeOverview = (leads: Lead[]): OverviewMetrics => {
  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now); monthAgo.setMonth(monthAgo.getMonth() - 1);

  const totalLeads = leads.length;
  const newLeads = leads.filter(l => new Date(l.acquiredAt) >= yesterday).length;
  const weekLeads = leads.filter(l => new Date(l.acquiredAt) >= weekAgo).length;
  const monthLeads = leads.filter(l => new Date(l.acquiredAt) >= monthAgo).length;
  const qualifiedLevels: FunnelLevel[] = ["lead_tiepido", "lead_caldo", "urgenza"];
  const qualifiedLeads = leads.filter(l => qualifiedLevels.includes(l.funnelLevel)).length;
  const hotLeads = leads.filter(l => ["lead_caldo", "urgenza"].includes(l.funnelLevel)).length;
  const conversions = leads.filter(l => l.status === "convertito" || l.status === "appuntamento_effettuato").length;
  const conversionRate = totalLeads > 0 ? Math.round((conversions / totalLeads) * 100) : 0;
  const daysActive = Math.max(1, Math.ceil(monthLeads > 0 ? 30 : 7));
  const avgLeadsPerDay = +(monthLeads / daysActive).toFixed(1);

  return {
    totalLeads, newLeads, weekLeads, monthLeads,
    qualifiedLeads, hotLeads,
    conversions, conversionRate,
    avgLeadsPerDay,
  };
};

// =====================================================
// TIME SERIES (lead per giorno/settimana/mese)
// =====================================================
export interface TimeSeriesPoint {
  date: string;        // "2025-05-08"
  label: string;       // formato leggibile
  count: number;
  qualified: number;
  hot: number;
  conversions: number;
}

export const computeTimeSeries = (
  leads: Lead[],
  granularity: "day" | "week" | "month",
  numberOfPeriods: number = 30
): TimeSeriesPoint[] => {
  const now = new Date();
  const buckets: Record<string, TimeSeriesPoint> = {};

  // Inizializza i bucket
  for (let i = 0; i < numberOfPeriods; i++) {
    const d = new Date(now);
    if (granularity === "day") {
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
    } else if (granularity === "week") {
      d.setDate(d.getDate() - (i * 7));
      const day = d.getDay() || 7;
      d.setDate(d.getDate() - (day - 1));
      d.setHours(0, 0, 0, 0);
    } else {
      d.setMonth(d.getMonth() - i);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
    }
    const key = formatDateKey(d);
    const label = granularity === "day"
      ? d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" })
      : granularity === "week"
      ? `Sett. ${d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}`
      : d.toLocaleDateString("it-IT", { month: "short", year: "numeric" });
    buckets[key] = { date: key, label, count: 0, qualified: 0, hot: 0, conversions: 0 };
  }

  // Popola con lead
  for (const lead of leads) {
    const d = new Date(lead.acquiredAt);
    let bucketDate = d;
    if (granularity === "week") {
      const day = d.getDay() || 7;
      bucketDate = new Date(d);
      bucketDate.setDate(d.getDate() - (day - 1));
    } else if (granularity === "month") {
      bucketDate = new Date(d.getFullYear(), d.getMonth(), 1);
    }
    bucketDate = startOfDay(bucketDate);
    const key = formatDateKey(bucketDate);
    if (buckets[key]) {
      buckets[key].count++;
      if (["lead_tiepido", "lead_caldo", "urgenza"].includes(lead.funnelLevel)) buckets[key].qualified++;
      if (["lead_caldo", "urgenza"].includes(lead.funnelLevel)) buckets[key].hot++;
      if (lead.status === "convertito" || lead.status === "appuntamento_effettuato") buckets[key].conversions++;
    }
  }

  // Ordina per data ascendente
  return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));
};

// =====================================================
// BREAKDOWN (raggruppa per dimensione)
// =====================================================
export interface BreakdownItem {
  key: string;
  label: string;
  count: number;
  percentage: number;
}

export const breakdownByLanding = (leads: Lead[]): BreakdownItem[] => {
  const counts: Record<string, { name: string; count: number }> = {};
  for (const l of leads) {
    const id = l.landingId || "unknown";
    const name = l.landingName || "(senza landing)";
    if (!counts[id]) counts[id] = { name, count: 0 };
    counts[id].count++;
  }
  const total = leads.length;
  return Object.entries(counts)
    .map(([key, v]) => ({
      key, label: v.name, count: v.count,
      percentage: total > 0 ? Math.round((v.count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
};

export const breakdownByLevel = (leads: Lead[]): BreakdownItem[] => {
  const counts: Record<string, number> = {};
  for (const l of leads) counts[l.funnelLevel] = (counts[l.funnelLevel] || 0) + 1;
  const total = leads.length;
  const labels: Record<string, string> = {
    lead_freddo: "Freddo",
    lead_tiepido: "Tiepido",
    lead_caldo: "Caldo",
    urgenza: "Urgenza",
  };
  return Object.entries(counts)
    .map(([k, v]) => ({
      key: k, label: labels[k] || k, count: v,
      percentage: total > 0 ? Math.round((v / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
};

export const breakdownByStatus = (leads: Lead[]): BreakdownItem[] => {
  const counts: Record<string, number> = {};
  for (const l of leads) counts[l.status] = (counts[l.status] || 0) + 1;
  const total = leads.length;
  const labels: Record<string, string> = {
    nuovo: "Nuovo",
    da_contattare: "Da contattare",
    contattato: "Contattato",
    appuntamento_prenotato: "Appuntamento prenotato",
    appuntamento_effettuato: "Appuntamento effettuato",
    non_risponde: "Non risponde",
    non_interessato: "Non interessato",
    convertito: "Convertito",
    archiviato: "Archiviato",
  };
  return Object.entries(counts)
    .map(([k, v]) => ({
      key: k, label: labels[k] || k, count: v,
      percentage: total > 0 ? Math.round((v / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
};

export const breakdownByFunnel = (leads: Lead[]): BreakdownItem[] => {
  const counts: Record<string, { name: string; count: number }> = {};
  for (const l of leads) {
    const id = l.funnelId || "unknown";
    const name = l.funnelName || "(senza funnel)";
    if (!counts[id]) counts[id] = { name, count: 0 };
    counts[id].count++;
  }
  const total = leads.length;
  return Object.entries(counts)
    .map(([k, v]) => ({
      key: k, label: v.name, count: v.count,
      percentage: total > 0 ? Math.round((v.count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
};

export const breakdownByTag = (leads: Lead[], maxResults = 10): BreakdownItem[] => {
  const counts: Record<string, number> = {};
  for (const l of leads) {
    for (const t of l.tags || []) counts[t] = (counts[t] || 0) + 1;
  }
  const total = leads.length;
  return Object.entries(counts)
    .map(([k, v]) => ({
      key: k, label: k, count: v,
      percentage: total > 0 ? Math.round((v / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxResults);
};

// =====================================================
// EMAIL ANALYTICS
// =====================================================
export const computeEmailOverview = (events: EmailEvent[]) => {
  return calculateMetrics(events);
};
