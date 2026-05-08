import React from "react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function AutomationRules() {
  const [rules] = React.useState<any[]>([]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Regole Automatiche</h2>
          <p className="text-gray-600 text-sm mt-1">Crea regole complesse con trigger e azioni multiple</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
        >
          <Plus size={18} /> Nuova Regola
        </motion.button>
      </div>

      {rules.length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-700">Nessuna regola creata</h3>
          <p className="text-gray-500 mt-2">Clicca il pulsante sopra per crearne una</p>
        </div>
      ) : null}
    </div>
  );
}
