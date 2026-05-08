import React from "react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function TemplateBuilder() {
  const [templates] = React.useState<any[]>([]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Template</h2>
          <p className="text-gray-600 text-sm mt-1">Gestisci i tuoi template pre-costruiti</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
        >
          <Plus size={18} /> Nuovo Template
        </motion.button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-700">Nessun template creato</h3>
          <p className="text-gray-500 mt-2">Clicca il pulsante sopra per crearne uno</p>
        </div>
      ) : null}
    </div>
  );
}
