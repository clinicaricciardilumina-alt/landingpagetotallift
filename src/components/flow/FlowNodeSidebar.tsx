import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { FLOW_NODE_DEFINITIONS, NODE_CATEGORIES } from "../../lib/flowNodeDefinitions";
import type { FlowNodeType, FlowNodeCategory } from "../../types";

export default function FlowNodeSidebar() {
  const [openCategories, setOpenCategories] = useState<Record<FlowNodeCategory, boolean>>({
    trigger: true,
    content: true,
    interaction: true,
    conversion: true,
    logic: false,
    automation: false,
    exit: false,
  });

  const onDragStart = (event: React.DragEvent, nodeType: FlowNodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const nodesByCategory = NODE_CATEGORIES.map(cat => ({
    ...cat,
    nodes: Object.values(FLOW_NODE_DEFINITIONS).filter(n => n.category === cat.id),
  }));

  return (
    <aside className="w-72 bg-white border-r-2 overflow-y-auto flex-shrink-0">
      <div className="p-4 border-b sticky top-0 bg-white z-10">
        <h3 className="font-black text-sm">Nodi disponibili</h3>
        <p className="text-[10px] text-gray-500">Trascina sul canvas</p>
      </div>

      <div className="p-2 space-y-1">
        {nodesByCategory.map(cat => (
          <div key={cat.id}>
            <button
              onClick={() => setOpenCategories(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 text-xs font-black uppercase"
              style={{ color: cat.color }}
            >
              {openCategories[cat.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              {cat.label}
              <span className="ml-auto text-gray-400 font-normal">{cat.nodes.length}</span>
            </button>

            {openCategories[cat.id] && (
              <div className="space-y-1 pl-1 pb-2">
                {cat.nodes.map(n => (
                  <div
                    key={n.type}
                    draggable
                    onDragStart={e => onDragStart(e, n.type)}
                    className="px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing border-2 hover:shadow-sm transition-all flex items-start gap-2"
                    style={{ backgroundColor: n.color, borderColor: n.borderColor + "40" }}
                  >
                    <span className="text-base flex-shrink-0">{n.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{n.label}</div>
                      <div className="text-[10px] opacity-70 truncate">{n.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
