import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { FLOW_NODE_DEFINITIONS } from "../../lib/flowNodeDefinitions";
import type { FlowNodeType } from "../../types";

function FlowNodeCard({ data, type, selected }: NodeProps) {
  const nodeType = (type || "trigger") as FlowNodeType;
  const def = FLOW_NODE_DEFINITIONS[nodeType] || FLOW_NODE_DEFINITIONS.trigger;
  const d = data as any;

  // Per le domande, mostra un handle per ogni opzione
  const isQuestion = nodeType === "question";
  const options = isQuestion ? d?.config?.options || [] : [];
  const hasMultipleOutputs = isQuestion && options.length > 0;

  return (
    <div
      className={`relative bg-white rounded-xl shadow-md border-2 transition-all ${
        selected ? "ring-2 ring-blue-500 ring-offset-2" : ""
      }`}
      style={{
        borderColor: def.borderColor,
        backgroundColor: def.color,
        minWidth: 200,
        maxWidth: 260,
      }}
    >
      {/* Input handle */}
      {!def.isStartNode && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: def.borderColor, width: 10, height: 10 }}
        />
      )}

      {/* Header */}
      <div className="px-3 py-2 border-b border-black/5">
        <div className="flex items-center gap-2">
          <span className="text-xl">{def.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase opacity-60 truncate">{def.label}</div>
            <div className="text-sm font-black text-gray-900 truncate">{d?.label || def.defaultLabel}</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-2 text-xs text-gray-700">
        {d?.description && <div className="text-[11px] mb-1 line-clamp-2">{d.description}</div>}

        {nodeType === "landing" && d?.config?.landingId && (
          <div className="text-[10px] opacity-60">Landing: {d.config.landingId.slice(0, 12)}…</div>
        )}
        {nodeType === "form" && d?.config?.formId && (
          <div className="text-[10px] opacity-60">Form: {d.config.formId.slice(0, 12)}…</div>
        )}
        {nodeType === "chat_ai" && d?.config?.chatBotId && (
          <div className="text-[10px] opacity-60">Bot: {d.config.chatBotId.slice(0, 12)}…</div>
        )}
        {isQuestion && (
          <div className="text-[11px] mt-1 line-clamp-2">{d?.config?.questionText}</div>
        )}
        {nodeType === "delay" && (
          <div className="text-[11px] font-bold">
            {d?.config?.amount} {d?.config?.unit}
          </div>
        )}
        {nodeType === "condition" && (
          <div className="text-[10px] font-mono">
            {d?.config?.rule} {d?.config?.operator} {d?.config?.value}
          </div>
        )}
        {nodeType === "action_email" && d?.config?.subject && (
          <div className="text-[10px] line-clamp-1">"{d.config.subject}"</div>
        )}
        {nodeType === "action_tag" && d?.config?.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {d.config.tags.slice(0, 3).map((t: string, i: number) => (
              <span key={i} className="text-[9px] px-1.5 py-0.5 bg-white rounded font-bold">{t}</span>
            ))}
          </div>
        )}

        {d?.stats && (
          <div className="text-[10px] mt-2 pt-2 border-t border-black/5 flex gap-2">
            <span>👁 {d.stats.reached || 0}</span>
            <span>✓ {d.stats.passed || 0}</span>
          </div>
        )}
      </div>

      {/* Output handles */}
      {hasMultipleOutputs ? (
        <div className="border-t border-black/5 px-3 py-2 space-y-1">
          {options.map((opt: any, i: number) => (
            <div key={opt.id || i} className="relative flex items-center justify-between text-[10px] font-bold">
              <span className="truncate">{opt.label}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={opt.id || `opt_${i}`}
                style={{
                  background: def.borderColor,
                  width: 10,
                  height: 10,
                  position: "relative",
                  right: -16,
                  top: 0,
                  transform: "none",
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        !def.isEndNode && (
          <Handle
            type="source"
            position={Position.Bottom}
            style={{ background: def.borderColor, width: 10, height: 10 }}
          />
        )
      )}
    </div>
  );
}

export default memo(FlowNodeCard);
