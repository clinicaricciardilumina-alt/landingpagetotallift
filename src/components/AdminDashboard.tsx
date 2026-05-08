import React, { useState, useEffect } from "react";
import {
  Layout, Calendar, Users, BarChart3, ChevronRight, ExternalLink,
  Globe, GitBranch, HelpCircle, FileText, Heart, Bell, UserCheck,
  Zap, Library, Settings as SettingsIcon
} from "lucide-react";
import { cn } from "../lib/utils";
import * as funnelService from "../lib/funnelService";

import LandingsManager from "./funnel/LandingsManager";
import FunnelsManager from "./funnel/FunnelsManager";
import QuestionsManager from "./funnel/QuestionsManager";
import FormsManager from "./funnel/FormsManager";
import ThankYouPagesManager from "./funnel/ThankYouPagesManager";
import SlotsManager from "./funnel/SlotsManager";
import AutomationsManager from "./funnel/AutomationsManager";
import LeadsManager from "./funnel/LeadsManager";
import TemplatesLibrary from "./funnel/TemplatesLibrary";

type Tab =
  | "landings"
  | "funnels"
  | "questions"
  | "forms"
  | "thankYou"
  | "slots"
  | "leads"
  | "automations"
  | "templates";

const NAV_ITEMS: { id: Tab; label: string; icon: any; group: string }[] = [
  { id: "landings", label: "Landing Pages", icon: Globe, group: "Contenuti" },
  { id: "templates", label: "Libreria Template", icon: Library, group: "Contenuti" },
  { id: "funnels", label: "Funnel", icon: GitBranch, group: "Funnel" },
  { id: "questions", label: "Domande & Logiche", icon: HelpCircle, group: "Funnel" },
  { id: "forms", label: "Moduli Contatto", icon: FileText, group: "Funnel" },
  { id: "thankYou", label: "Thank You Pages", icon: Heart, group: "Funnel" },
  { id: "slots", label: "Slot Prenotazione", icon: Calendar, group: "Operativo" },
  { id: "leads", label: "Lead Management", icon: UserCheck, group: "Operativo" },
  { id: "automations", label: "Automazioni", icon: Zap, group: "Operativo" },
];

export default function AdminDashboard({ setIsAuthenticated }: { setIsAuthenticated: (val: boolean) => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("landings");
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    totalLandings: 0,
    publishedLandings: 0,
    activeFunnels: 0,
    availableSlots: 0,
  });

  useEffect(() => {
    refreshStats();
  }, [activeTab]);

  const refreshStats = async () => {
    try {
      const [leads, landings, funnels, slots] = await Promise.all([
        funnelService.getLeads(),
        funnelService.getLandings(),
        funnelService.getFunnels(),
        funnelService.getBookingSlots(),
      ]);
      setStats({
        totalLeads: leads.length,
        newLeads: leads.filter(l => l.status === "nuovo").length,
        totalLandings: landings.length,
        publishedLandings: landings.filter(l => l.status === "pubblicata").length,
        activeFunnels: funnels.filter(f => f.status === "attivo").length,
        availableSlots: slots.filter(s => s.status === "disponibile").length,
      });
    } catch (e) {
      console.error("Errore stats:", e);
    }
  };

  // Group nav items
  const groups: Record<string, typeof NAV_ITEMS> = {};
  NAV_ITEMS.forEach(item => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-[#0066A1] to-[#003355] text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-black">Funnel Builder</h1>
          <p className="text-white/60 text-xs mt-1">Studio Dentistico</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-4">
          {Object.entries(groups).map(([groupName, items]) => (
            <div key={groupName}>
              <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2 px-3">{groupName}</div>
              <div className="space-y-1">
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                      activeTab === item.id
                        ? "bg-white/20 shadow-md border-l-4 border-[#96C8E6]"
                        : "hover:bg-white/5 text-white/70 hover:text-white"
                    )}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            onClick={() => {
              localStorage.removeItem("adminAuthenticated");
              setIsAuthenticated(false);
              window.location.href = "/admin";
            }}
            className="w-full py-3 bg-red-600/80 rounded-xl text-xs font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
          >
            Logout <ChevronRight size={14} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header con stats */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900">
                {NAV_ITEMS.find(n => n.id === activeTab)?.label}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white px-4 py-2 rounded-xl shadow-sm">
                <div className="text-xs font-bold text-gray-400 uppercase">Lead Tot</div>
                <div className="text-xl font-black text-blue-600">{stats.totalLeads}</div>
              </div>
              <div className="bg-white px-4 py-2 rounded-xl shadow-sm">
                <div className="text-xs font-bold text-gray-400 uppercase">Nuovi</div>
                <div className="text-xl font-black text-yellow-600">{stats.newLeads}</div>
              </div>
              <div className="bg-white px-4 py-2 rounded-xl shadow-sm">
                <div className="text-xs font-bold text-gray-400 uppercase">Landing Live</div>
                <div className="text-xl font-black text-green-600">{stats.publishedLandings}/{stats.totalLandings}</div>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="bg-transparent">
            {activeTab === "landings" && <LandingsManager />}
            {activeTab === "templates" && <TemplatesLibrary />}
            {activeTab === "funnels" && <FunnelsManager />}
            {activeTab === "questions" && <QuestionsManager />}
            {activeTab === "forms" && <FormsManager />}
            {activeTab === "thankYou" && <ThankYouPagesManager />}
            {activeTab === "slots" && <SlotsManager />}
            {activeTab === "leads" && <LeadsManager />}
            {activeTab === "automations" && <AutomationsManager />}
          </div>
        </div>
      </main>
    </div>
  );
}
