import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Copy, Workflow } from "lucide-react";
import * as flowFunnelService from "../../lib/flowFunnelService";
import { createFlowNode } from "../../lib/flowNodeDefinitions";
import FlowCanvas from "./FlowCanvas";
import type { FlowFunnel } from "../../types";

export default function FlowFunnelsList() {
  const [funnels, setFunnels] = useState<FlowFunnel[]>([]);
  const [editing, setEditing] = useState<FlowFunnel | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    setFunnels(await flowFunnelService.getFlowFunnels());
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const create = async () => {
    const trigger = createFlowNode("trigger", { x: 250, y: 50 });
    const funnel = await flowFunnelService.addFlowFunnel({
      name: "Nuovo Funnel Visuale",
      goal: "Acquisizione lead",
      nodes: [trigger],
      edges: [],
      initialLevel: "lead_freddo",
      defaultTags: [],
      status: "bozza",
    });
    refresh();
    setEditing(funnel);
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminare questo funnel? Operazione irreversibile.")) return;
    await flowFunnelService.deleteFlowFunnel(id);
    refresh();
  };

  const duplicate = async (id: string) => {
    await flowFunnelService.duplicateFlowFunnel(id);
    refresh();
  };

  if (editing) {
    return <FlowCanvas funnel={editing} onClose={() => { setEditing(null); refresh(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Flow Builder</h2>
          <p className="text-gray-500 text-sm">Costruisci funnel visualmente</p>
        </div>
        <button onClick={create} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2">
          <Plus size={18} /> Nuovo Flow
        </button>
      </div>

      {loading ? (
        <p>Caricamento...</p>
      ) : funnels.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed">
          <Workflow size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-xl font-black mb-2">Nessun funnel visuale</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Costruisci funnel come un grafo: collega landing, domande, moduli, chat AI, condizioni, automazioni.
          </p>
          <button onClick={create} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold">
            + Crea il primo funnel visuale
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {funnels.map(f => (
            <div key={f.id} className="bg-white p-5 rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-300 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-black truncate">{f.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{f.goal}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  f.status === "attivo" ? "bg-green-100 text-green-700" :
                  f.status === "bozza" ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {f.status.toUpperCase()}
                </span>
              </div>

              <div className="text-xs text-gray-500 mb-4 flex gap-3">
                <span>📦 {f.nodes?.length || 0} nodi</span>
                <span>🔗 {f.edges?.length || 0} connessioni</span>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setEditing(f)} className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-100">
                  <Edit2 size={12} /> Apri
                </button>
                <button onClick={() => duplicate(f.id)} className="px-3 py-2 border-2 rounded-lg hover:bg-gray-50">
                  <Copy size={12} />
                </button>
                <button onClick={() => remove(f.id)} className="px-3 py-2 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
