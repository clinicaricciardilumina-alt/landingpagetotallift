import React, { useState, useEffect } from "react";
import {
  ChevronRight, Globe, GitBranch, HelpCircle, FileText, Heart,
  Calendar, UserCheck, Library, BarChart3, TrendingUp, Settings as SettingsIcon,
  MessageCircle, Mail, Layers, Zap, Workflow,
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
import FlowFunnelsList from "./flow/FlowFunnelsList";
import ChatBotsManager from "./chat/ChatBotsManager";
import NotificationsManager from "./notifications/NotificationsManager";
import SettingsManager from "./settings/SettingsManager";

type Tab =
  | "landings" | "templates" | "forms" | "thankYou" | "questions" | "quickFunnels"
  | "flowFunnels"
  | "chatBots" | "notifications" | "automations"
  | "leads" | "slots"
  | "settings";

interface NavItem {
  id: Tab;
  label: string;
  icon: any;
  badge?: "NEW" | "BETA";
}

interface NavGroup {
  id: string;
  label: string;
  icon: any;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "builder",
    label: "BUILDER",
    icon: Layers,
    items: [
      { id: "landings", label: "Landing Pages", icon: Globe },
      { id: "templates", label: "Libreria Template", icon: Library },
      { id: "flowFunnels", label: "Flow Builder", icon: Workflow, badge: "NEW" },
      { id: "forms", label: "Moduli Contatto", icon: FileText },
      { id: "thankYou", label: "Thank You Pages", icon: Heart },
      { id: "questions", label: "Domande (lista)", icon: HelpCircle },
      { id: "quickFunnels", label: "Funnel (lista)", icon: GitBranch },
    ],
  },
  {
    id: "engagement",
    label: "ENGAGEMENT",
    icon: MessageCircle,
    items: [
      { id: "chatBots", label: "Chat AI", icon: MessageCircle, badge: "NEW" },
      { id: "notifications", label: "Notifiche Email", icon: Mail, badge: "NEW" },
      { id: "automations", label: "Workflow", icon: Workflow },
    ],
  },
  {
    id: "crm",
    label: "LEAD CRM",
    icon: UserCheck,
    items: [
      { id: "leads", label: "Lead Management", icon: UserCheck },
      { id: "slots", label: "Slot Prenotazione", icon: Calendar },
    ],
  },
  {
    id: "system",
    label: "SISTEMA",
    icon: SettingsIcon,
    items: [
      { id: "settings", label: "Impostazioni & API", icon: SettingsIcon },
    ],
  },
];

export default function AdminDashboard({ setIsAuthenticated }: { setIsAuthenticated: (val: boolean) => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("landings");
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    publishedLandings: 0,
    totalLandings: 0,
  });

  useEffect(() => {
    refreshStats();
  }, [activeTab]);

  const refreshStats = async () => {
    try {
      const [leads, landings] = await Promise.all([
        funnelService.getLeads(),
        funnelService.getLandings(),
      ]);
      setStats({
        totalLeads: leads.length,
        newLeads: leads.filter((l) => l.status === "nuovo").length,
        totalLandings: landings.length,
        publishedLandings: landings.filter((l) => l.status === "pubblicata").length,
      });
    } catch (e) {
      console.error("Errore stats:", e);
    }
  };

  // Flow builder takes the full screen
  if (activeTab === "flowFunnels") {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} setIsAuthenticated={setIsAuthenticated} />
        <main className="flex-1 overflow-hidden">
          <FlowFunnelsList />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <SidebarNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setIsAuthenticated={setIsAuthenticated}
      />

      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900">
                {NAV_GROUPS.flatMap((g) => g.items).find((n) => n.id === activeTab)?.label}
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
                <div className="text-xl font-black text-green-600">
                  {stats.publishedLandings}/{stats.totalLandings}
                </div>
              </div>
            </div>
          </header>

          <div>
            {activeTab === "landings" && <LandingsManager />}
            {activeTab === "templates" && <TemplatesLibrary />}
            {activeTab === "questions" && <QuestionsManager />}
            {activeTab === "forms" && <FormsManager />}
            {activeTab === "thankYou" && <ThankYouPagesManager />}
            {activeTab === "slots" && <SlotsManager />}
            {activeTab === "leads" && <LeadsManager />}
            {activeTab === "automations" && <AutomationsManager />}
            {activeTab === "quickFunnels" && <FunnelsManager />}
            {activeTab === "flowFunnels" && <FlowFunnelsList />}
            {activeTab === "chatBots" && <ChatBotsManager />}
            {activeTab === "notifications" && <NotificationsManager />}
            {activeTab === "settings" && <SettingsManager />}
          </div>
        </div>
      </main>
    </div>
  );
}

// =====================================================
// Sidebar Nav
// =====================================================
function SidebarNav({
  activeTab,
  setActiveTab,
  setIsAuthenticated,
}: {
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  setIsAuthenticated: (v: boolean) => void;
}) {
  return (
    <aside className="w-72 bg-gradient-to-b from-[#0066A1] to-[#003355] text-white flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-white/10">
        <h1 className="text-xl font-black">Funnel Builder</h1>
        <p className="text-white/60 text-[10px] mt-0.5">Studio Dentistico</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.id}>
            <div className="text-white/40 text-[10px] font-black uppercase tracking-wider mb-1.5 px-2 flex items-center gap-2">
              <group.icon size={12} />
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold transition-all",
                    activeTab === item.id
                      ? "bg-white/20 shadow-md"
                      : "hover:bg-white/5 text-white/70 hover:text-white"
                  )}
                >
                  <item.icon size={16} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] bg-yellow-400 text-yellow-900 px-1.5 rounded font-black">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => {
            localStorage.removeItem("adminAuthenticated");
            setIsAuthenticated(false);
            window.location.href = "/admin";
          }}
          className="w-full py-2 bg-red-600/80 rounded-lg text-xs font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-1.5"
        >
          Logout <ChevronRight size={12} />
        </button>
      </div>
    </aside>
  );
}
