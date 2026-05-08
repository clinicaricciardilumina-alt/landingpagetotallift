import React, { useState } from "react";
import { Plus, Trash2, Eye, Save } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPageBuilder() {
  const [pages, setPages] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Landing Pages</h2>
          <p className="text-gray-600 text-sm mt-1">Crea e modifica landing pages con blocchi personalizzati</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
        >
          <Plus size={18} /> Nuova Landing Page
        </motion.button>
      </div>

      {pages.length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-700">Nessuna landing page creata</h3>
          <p className="text-gray-500 mt-2">Clicca il pulsante sopra per crearne una</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pages.map((page, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all">
              <h3 className="font-bold text-gray-900 mb-2">{page.title}</h3>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                >
                  <Eye size={16} /> Preview
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
