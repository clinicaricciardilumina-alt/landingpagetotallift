import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Save, Image as ImageIcon, Layout, Settings, CheckCircle2, AlertCircle, 
  Trash2, Plus, Calendar, Users, BarChart3, HelpCircle, ChevronRight,
  ExternalLink, Clock
} from "lucide-react";
import type { LandingSettings, Question } from "../types";
import { cn } from "../lib/utils";
import * as firebaseService from "../lib/firebaseService";

type Tab = "customize" | "questions" | "slots" | "bookings" | "stats";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("customize");
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const [slotForm, setSlotForm] = useState({ date: "", time: "09:00", capacity: 4 });

  useEffect(() => {
    refreshAllData();
  }, [activeTab]);

  const refreshAllData = async () => {
    try {
      const settingsData = await firebaseService.getSettings();
      const questionsData = await firebaseService.getQuestions();
      const slotsData = await firebaseService.getSlots();
      const bookingsData = await firebaseService.getBookings();
      const statsData = await firebaseService.getStats();
      
      setSettings(settingsData || { 
        hero_title: "TOTAL LIFT", 
        hero_subtitle: "Total Beauty Day", 
        hero_date: "", 
        hero_description: "", 
        cta_text: "", 
        hero_image: "", 
        selected_images: [], 
        image_urls: {} 
      });
      setQuestions(questionsData);
      setSlots(slotsData);
      setBookings(bookingsData);
      setStats(statsData);
      setAvailableImages(["hero.jpg", "before-after-1.jpg", "before-after-2.jpg", "before-after-3.jpg", "studio.jpg", "procedure.jpg"]);
    } catch (e) {
      console.error("Errore Firebase:", e);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await firebaseService.saveSettings(settings);
      setSaveStatus("success");
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const addQuestion = async () => {
    await firebaseService.addQuestion({ text: "Nuova Domanda", options: ["Opzione 1", "Opzione 2"], type: "single" });
    refreshAllData();
  };

  const deleteQuestion = async (id: any) => {
    if (!confirm("Eliminare questa domanda?")) return;
    await firebaseService.deleteQuestion(id);
    refreshAllData();
  };

  const createSlot = async () => {
    if (!slotForm.date) return alert("Scegli una data");
    await firebaseService.addSlot(slotForm);
    setSlotForm({ date: "", time: "09:00", capacity: 4 });
    refreshAllData();
  };

  const deleteSlot = async (id: string) => {
    if (!confirm("Eliminare questo slot?")) return;
    await firebaseService.deleteSlot(id);
    refreshAllData();
  };

  const toggleImageSelection = (img: string) => {
    if (!settings) return;
    const isSelected = settings.selected_images.includes(img);
    setSettings({
      ...settings,
      selected_images: isSelected 
        ? settings.selected_images.filter(i => i !== img) 
        : [...settings.selected_images, img]
    });
  };

  if (!settings) return <div className="p-8 text-center font-bold text-gray-500">Caricamento...</div>;

  return (
    <div className="min-h-screen bg-[#f5f8fa] flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-gradient-to-b from-[#0066A1] to-[#004d7a] text-white flex flex-col shadow-2xl shrink-0 z-30">
        <div className="p-8 border-b border-white/10">
          <h2 className="text-xl font-black tracking-tighter flex items-center gap-2">
            <Layout size={24} /> RICCIARDI
          </h2>
          <p className="text-[10px] opacity-60 font-black uppercase tracking-widest mt-1">Admin Panel</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {[
            { id: "customize" as Tab, label: "Personalizza Landing", icon: Layout },
            { id: "questions" as Tab, label: "Gestisci Domande", icon: HelpCircle },
            { id: "slots" as Tab, label: "Gestisci Slot", icon: Calendar },
            { id: "bookings" as Tab, label: "Prenotazioni", icon: Users },
            { id: "stats" as Tab, label: "Statistiche", icon: BarChart3 }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-xl font-bold transition-all transform hover:translate
