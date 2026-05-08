import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail, Bell, Settings, Link2, CheckSquare, Calendar,
  Plus, ChevronRight, Zap, Clock, AlertCircle
} from "lucide-react";
import EmailAutomation from "./EmailAutomation";
import InternalNotifications from "./InternalNotifications";
import AutomationRules from "./AutomationRules";
import WebhookIntegrations from "./WebhookIntegrations";
import PostFormActions from "./PostFormActions";
import PostBookingActions from "./PostBookingActions";
import AutomationHistory from "./AutomationHistory";

type AutomazioniTab = "email" | "notifications" | "rules" | "webhooks" | "forms" | "booking" | "history";

interface AutomazioneSection {
  id: AutomazioniTab;
  label: string;
  icon: any;
  description: string;
  color: string;
  bgColor: string;
}

export default function AutomazioniMain() {
  const [activeTab, setActiveTab] = useState<AutomazioniTab>("email");

  const sections: AutomazioneSection[] = [
    {
      id: "email",
      label: "Email Automation",
      icon: Mail,
      description: "Invia email automatiche basate su trigger",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      id: "notifications",
      label: "Notifiche Interne",
      icon: Bell,
      description: "Notifiche push e interne in tempo reale",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      id: "rules",
      label: "Regole Automatiche",
      icon: Settings,
      description: "Crea regole complesse con condizioni",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      id: "webhooks",
      label: "Webhook",
      icon: Link2,
      description: "Integrazioni esterne via webhook",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10"
    },
    {
      id: "forms",
      label: "Post-Form Actions",
      icon: CheckSquare,
      description: "Azioni dopo compilazione modulo",
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      id: "booking",
      label: "Post-Booking Actions",
      icon: Calendar,
      description: "Azioni dopo prenotazione",
      color: "text-red-500",
      bgColor: "bg-red-500/10"
    },
    {
      id: "history",
      label: "Storico",
      icon: Clock,
      description: "Log di tutte le automazioni eseguite",
      color: "text-gray-500",
      bgColor: "bg-gray-500/10"
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "email":
        return <EmailAutomation />;
      case "notifications":
        return <InternalNotifications />;
      case "rules":
        return <AutomationRules />;
      case "webhooks":
        return <WebhookIntegrations />;
      case "forms":
        return <PostFormActions />;
      case "booking":
        return <PostBookingActions />;
      case "history":
        return <AutomationHistory />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Zap size={28} className="text-purple-600" />
          Automazioni
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Configura azioni automatiche basate su trigger e condizioni
        </p>
      </div>

      {/* Tabs/Sections */}
      <div className="bg-white border-b border-gray-200 px-8 overflow-x-auto">
        <div className="flex gap-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeTab === section.id;

            return (
              <motion.button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-purple-600 text-purple-600 font-semibold"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon size={18} />
                <span className="text-sm">{section.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
}
