import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export default function TagsAndLevels() {
  const [tags] = React.useState<any[]>([]);
  const [levels] = React.useState<any[]>([]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tags & Levels</h2>
            <p className="text-gray-600 text-sm mt-1">Gestisci etichette e livelli di segmentazione</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-all"
          >
            <Plus size={18} /> Nuovo Tag
          </motion.button>
        </div>

        {tags.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-700">Nessun tag creato</h3>
            <p className="text-gray-500 mt-2">Clicca il pulsante sopra per crearne uno</p>
          </div>
        ) : null}
      </div>

      <div className="border-t pt-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Livelli</h3>
        {levels.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-700">Nessun livello creato</h3>
            <p className="text-gray-500 mt-2">I livelli categorizzano i tuoi contatti</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
