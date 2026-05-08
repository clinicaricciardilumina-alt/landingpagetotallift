import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, Palette, Zap, HelpCircle, Settings, Plus,
  ChevronRight, Grid3x3, BookOpen, Layers, FormInput, CheckCircle,
  Calendar, Tag
} from "lucide-react";
import LandingPageBuilder from "./LandingPageBuilder";
import TemplateBuilder from "./TemplateBuilder";
import FunnelBuilder from "./FunnelBuilder";
import FormBuilder from "./FormBuilder";
import QuestionBuilder from "./QuestionBuilder";
import ThankYouPageBuilder from "./ThankYouPageBuilder";
import BookingSlotBuilder from "./BookingSlotBuilder";
import TagsAndLevels from "./TagsAndLevels";

type BuilderTab = "landing" | "templates" | "funnels" | "forms" | "questions" | "thankyou" | "slots" | "tags";

interface BuilderSection {
  id: BuilderTab;
  label: string;
  icon: any;
  description: string;
  color: string;
  bgColor: string;
}

export default function BuilderMain() {
  const [activeTab, setActiveTab] = useState<BuilderTab>("landing");

  const sections: BuilderSection[] = [
    {
      id: "landing",
      label: "Landing Pages",
      icon: FileText,
      description: "Crea e modifica landing pages con blocchi",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      id: "templates",
      label: "Templates",
      icon: Palette,
      description: "Gestisci template pre-costruiti",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      id: "funnels",
      label: "Funnels",
      icon: Zap,
      description: "Crea funnel con logica condizionale",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      id: "forms",
      label: "Forms",
      icon: FormInput,
      description: "Costruisci moduli personalizzati",
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      id: "questions",
      label: "Questions",
      icon: HelpCircle,
      description: "Gestisci domande e risposte",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    {
      id: "thankyou",
      label: "Thank You Pages",
      icon: CheckCircle,
      description: "Pagine di ringraziamento personalizzate",
      color: "text-pink-500",
      bgColor: "bg-pink-500/10"
    },
    {
      id: "slots",
      label: "Booking Slots",
      icon: Calendar,
      description: "Gestisci slot prenotazioni",
      color: "text-red-500",
      bgColor: "bg-red-500/10"
    },
    {
      id: "tags",
      label: "Tags & Levels",
      icon: Tag,
      description: "Etichette e livelli segmentazione",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10"
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "landing":
        return <LandingPageBuilder />;
      case "templates":
        return <TemplateBuilder />;
      case "funnels":
        return <FunnelBuilder />;
      case "forms":
        return <FormBuilder />;
      case "questions":
        return <QuestionBuilder />;
      case "thankyou":
        return <ThankYouPageBuilder />;
      case "slots":
        return <BookingSlotBuilder />;
      case "tags":
        return <TagsAndLevels />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Grid3x3 size={28} className="text-blue-600" />
          Builder
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Costruisci landing pages, funnel, moduli e molto altro
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
                    ? "border-blue-600 text-blue-600 font-semibold"
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
