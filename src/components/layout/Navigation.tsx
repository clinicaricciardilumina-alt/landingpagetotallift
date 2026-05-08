import React from "react";
import { motion } from "framer-motion";
import {
  Layout, Settings, LogOut, Palette, Zap,
  ChevronRight
} from "lucide-react";

interface NavigationProps {
  currentArea: "builder" | "automazioni" | "customize";
  onAreaChange: (area: "builder" | "automazioni" | "customize") => void;
  onLogout: () => void;
}

export default function Navigation({ currentArea, onAreaChange, onLogout }: NavigationProps) {
  const navItems = [
    {
      id: "customize" as const,
      label: "Personalizza",
      icon: Palette,
      color: "text-amber-500"
    },
    {
      id: "builder" as const,
      label: "Builder",
      icon: Layout,
      color: "text-blue-500"
    },
    {
      id: "automazioni" as const,
      label: "Automazioni",
      icon: Zap,
      color: "text-purple-500"
    },
  ];

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">Studio Ricciardi</h1>
        <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentArea === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => onAreaChange(item.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
              }`}
            >
              <Icon size={18} className={isActive ? "text-blue-400" : item.color} />
              <span className="font-medium">{item.label}</span>
              {isActive && <ChevronRight size={16} className="ml-auto" />}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <motion.button
          onClick={onLogout}
          whileHover={{ x: 4 }}
          className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Esci</span>
        </motion.button>
      </div>
    </div>
  );
}
