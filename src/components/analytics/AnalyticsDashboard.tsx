import React, { useEffect, useState, useMemo } from "react";
import { TrendingUp, Users, Target, Mail, BarChart3, Calendar } from "lucide-react";
import * as funnelService from "../../lib/funnelService";
import * as eventService from "../../lib/emailEventService";
import * as analytics from "../../lib/analyticsService";
import type { Lead, EmailEvent } from "../../types";

export default function AnalyticsDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("day");
  const [periods, setPeriods] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [l, e] = await Promise.all([
        funnelService.getLeads(),
        eventService.getEmailEvents(1000),
      ]);
      setLeads(l);
      setEvents(e);
      setLoading(false);
    })();
  }, []);

  // Calcoli memo
  const overview = useMemo(() => analytics.computeOverview(leads), [leads]);
  const timeSeries = useMemo(() => analytics.computeTimeSeries(leads, granularity, periods), [leads, granularity, periods]);
  const byLanding = useMemo(() => analytics.breakdownByLanding(leads), [leads]);
  const byLevel = useMemo(() => analytics.breakdownByLevel(leads), [leads]);
  const byStatus = useMemo(() => analytics.breakdownByStatus(leads), [leads]);
  const byFunnel = useMemo(() => analytics.breakdownByFunnel(leads), [leads]);
  const byTag = useMemo(() => analytics.breakdownByTag(leads, 10), [leads]);
  const emailMetrics = useMemo(() => analytics.computeEmailOverview(events), [events]);

  if (loading) return <p>Caricamento analytics...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Analytics</h2>
        <p className="text-gray-500 text-sm">Performance e statistiche dei tuoi funnel</p>
      </div>

      {/* OVERVIEW METRICS */}
      <div className="grid md:grid-cols-4 gap-3">
        <MetricCard
          icon={<Users size={20} />}
          label="Lead totali"
          value={overview.totalLeads}
          sub={`+${overview.newLeads} nelle 24h`}
          color="blue"
        />
        <MetricCard
          icon={<TrendingUp size={20} />}
          label="Lead questo mese"
          value={overview.monthLeads}
          sub={`Media ${overview.avgLeadsPerDay}/giorno`}
          color="green"
        />
        <MetricCard
          icon={<Target size={20} />}
          label="Lead caldi/urgenti"
          value={overview.hotLeads}
          sub={`${overview.qualifiedLeads} qualificati totali`}
          color="orange"
        />
        <MetricCard
          icon={<BarChart3 size={20} />}
          label="Conversion rate"
          value={`${overview.conversionRate}%`}
          sub={`${overview.conversions} chiusi positivi`}
          color="purple"
        />
      </div>

      {/* TIME SERIES CHART */}
      <div className="bg-white p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black">Andamento lead nel tempo</h3>
          <div className="flex items-center gap-2">
            <select value={granularity} onChange={e => {
              const g = e.target.value as any;
              setGranularity(g);
              setPeriods(g === "day" ? 30 : g === "week" ? 12 : 12);
            }} className="border-2 rounded-lg px-2 py-1 text-xs font-bold">
              <option value="day">Giornaliero</option>
              <option value="week">Settimanale</option>
              <option value="month">Mensile</option>
            </select>
          </div>
        </div>
        <BarChart data={timeSeries} />
      </div>

      {/* BREAKDOWNS */}
      <div className="grid md:grid-cols-2 gap-3">
        <BreakdownCard title="Lead per livello funnel" data={byLevel} colorMap={LEVEL_COLORS} />
        <BreakdownCard title="Lead per stato" data={byStatus} />
        <BreakdownCard title="Lead per landing" data={byLanding} />
        <BreakdownCard title="Lead per funnel" data={byFunnel} />
      </div>

      {/* TOP TAGS */}
      <BreakdownCard title="Tag più frequenti (top 10)" data={byTag} />

      {/* EMAIL METRICS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm">
        <h3 className="font-black mb-4 flex items-center gap-2">
          <Mail size={18} /> Metriche email
        </h3>
        {emailMetrics.sent === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">
            Nessuna email inviata ancora. Configura le regole notifiche o le sequenze automatiche per iniziare.
          </p>
        ) : (
          <div className="grid md:grid-cols-4 gap-3">
            <MiniMetric label="Inviate" value={emailMetrics.sent} />
            <MiniMetric label="Aperture" value={emailMetrics.opened} extra={`${emailMetrics.openRate}%`} />
            <MiniMetric label="Click" value={emailMetrics.clicked} extra={`${emailMetrics.clickRate}%`} />
            <MiniMetric label="Bounce" value={emailMetrics.bounced} extra={`${emailMetrics.bounceRate}%`} negative />
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// COMPONENTS
// =====================================================
const LEVEL_COLORS: Record<string, string> = {
  Freddo: "#94a3b8",
  Tiepido: "#fbbf24",
  Caldo: "#f97316",
  Urgenza: "#ef4444",
};

function MetricCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  color: "blue" | "green" | "orange" | "purple";
}) {
  const colorMap = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
    green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  }[color];
  return (
    <div className={`bg-white p-4 rounded-2xl shadow-sm border-2 ${colorMap.border}`}>
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${colorMap.bg} ${colorMap.text} mb-2`}>
        {icon}
      </div>
      <div className="text-3xl font-black text-gray-900">{value}</div>
      <div className="text-[11px] font-bold text-gray-500 uppercase">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function MiniMetric({ label, value, extra, negative }: { label: string; value: number; extra?: string; negative?: boolean }) {
  return (
    <div className="bg-gray-50 p-3 rounded-xl">
      <div className="text-[10px] font-bold uppercase text-gray-500">{label}</div>
      <div className={`text-2xl font-black ${negative ? "text-red-600" : "text-gray-900"}`}>{value}</div>
      {extra && <div className="text-[10px] text-gray-400">{extra}</div>}
    </div>
  );
}

function BarChart({ data }: { data: analytics.TimeSeriesPoint[] }) {
  if (data.length === 0) return <p className="text-xs text-gray-500 text-center py-8">Nessun dato</p>;
  const maxCount = Math.max(...data.map(d => d.count), 1);
  return (
    <div>
      <div className="flex items-end gap-1 h-48">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
            <div
              className="w-full bg-blue-500 hover:bg-blue-600 rounded-t transition-all relative cursor-pointer"
              style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count > 0 ? 2 : 0 }}
              title={`${d.label}: ${d.count} lead`}
            >
              {d.hot > 0 && (
                <div
                  className="absolute bottom-0 left-0 right-0 bg-orange-500 rounded-t"
                  style={{ height: `${(d.hot / d.count) * 100}%` }}
                  title={`${d.hot} caldi/urgenti`}
                />
              )}
            </div>
            <div className="absolute -top-6 hidden group-hover:block bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-10">
              {d.count} lead
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-[9px] text-gray-400 text-center truncate" title={d.label}>
            {d.label}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded inline-block"></span> Tutti i lead</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-500 rounded inline-block"></span> Caldi/urgenti</span>
      </div>
    </div>
  );
}

function BreakdownCard({ title, data, colorMap }: {
  title: string;
  data: analytics.BreakdownItem[];
  colorMap?: Record<string, string>;
}) {
  if (data.length === 0) {
    return (
      <div className="bg-white p-5 rounded-2xl shadow-sm">
        <h3 className="font-black mb-3">{title}</h3>
        <p className="text-xs text-gray-500 text-center py-4">Nessun dato</p>
      </div>
    );
  }
  const max = data[0].count || 1;
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm">
      <h3 className="font-black mb-3">{title}</h3>
      <div className="space-y-2">
        {data.map(item => (
          <div key={item.key}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-bold truncate flex-1 mr-2">{item.label}</span>
              <span className="text-gray-500 flex-shrink-0">{item.count} ({item.percentage}%)</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(item.count / max) * 100}%`,
                  backgroundColor: colorMap?.[item.label] || "#3b82f6",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
