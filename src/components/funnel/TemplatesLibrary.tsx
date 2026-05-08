import React from "react";
import { LANDING_TEMPLATE_DEFINITIONS } from "../../lib/landingTemplates";
import { LANDING_TEMPLATES } from "../../types";

export default function TemplatesLibrary() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Libreria Template</h2>
        <p className="text-gray-500 text-sm">I 7 template disponibili per creare nuove landing page</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {LANDING_TEMPLATES.map(t => {
          const def = LANDING_TEMPLATE_DEFINITIONS[t.value];
          return (
            <div key={t.value} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="p-8 text-white" style={{ background: `linear-gradient(135deg, ${def.primaryColor} 0%, ${def.secondaryColor} 100%)` }}>
                <h3 className="text-2xl font-black mb-2">{def.defaultHeadline}</h3>
                <p className="opacity-90">{def.defaultSubtitle}</p>
                <button className="mt-4 px-5 py-2 bg-white text-gray-900 rounded-lg font-bold text-sm">{def.defaultCta}</button>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-black">{t.label}</h4>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded font-bold">{t.value}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{t.description}</p>
                <div className="flex flex-wrap gap-1">
                  {def.blocks().map((b, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded font-bold">{b.type}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl">
        <h3 className="font-black text-lg mb-2">💡 Come funzionano i template</h3>
        <p className="text-sm text-gray-700 mb-3">
          Quando crei una nuova landing dalla sezione <strong>Landing Pages → Nuova Landing</strong>, scegli uno di questi 7 template come base. 
          La landing viene creata con headline, sottotitolo, colori e blocchi di contenuto pre-impostati.
        </p>
        <p className="text-sm text-gray-700">
          Dopo la creazione puoi modificare ogni elemento dall'editor: testi, colori, ordine dei blocchi, 
          collegamenti a moduli/funnel/thank you pages.
        </p>
      </div>
    </div>
  );
}
