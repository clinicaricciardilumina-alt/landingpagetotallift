import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "./Navigation";
import BuilderMain from "../Builder/BuilderMain";
import AutomazioniMain from "../Automazioni/AutomazioniMain";
import AdminDashboard from "../AdminDashboard";

interface AdminLayoutProps {
  setIsAuthenticated: (val: boolean) => void;
}

type AreaType = "customize" | "builder" | "automazioni";

export default function AdminLayout({ setIsAuthenticated }: AdminLayoutProps) {
  const [currentArea, setCurrentArea] = useState<AreaType>("customize");

  const handleLogout = () => {
    if (confirm("Sei sicuro di voler uscire?")) {
      setIsAuthenticated(false);
    }
  };

  const renderContent = () => {
    const contentVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 }
    };

    switch (currentArea) {
      case "customize":
        return (
          <motion.div
            key="customize"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-auto"
          >
            <AdminDashboard setIsAuthenticated={setIsAuthenticated} />
          </motion.div>
        );

      case "builder":
        return (
          <motion.div
            key="builder"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-auto"
          >
            <BuilderMain />
          </motion.div>
        );

      case "automazioni":
        return (
          <motion.div
            key="automazioni"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-auto"
          >
            <AutomazioniMain />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <Navigation
        currentArea={currentArea}
        onAreaChange={setCurrentArea}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
    </div>
  );
}
