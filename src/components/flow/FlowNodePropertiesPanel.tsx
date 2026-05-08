import React, { useEffect, useState } from "react";
import { X, Trash2, Plus } from "lucide-react";
import { FLOW_NODE_DEFINITIONS } from "../../lib/flowNodeDefinitions";
import * as funnelService from "../../lib/funnelService";
import * as chatService from "../../lib/chatService";
import { FUNNEL_LEVELS } from "../../types";
import type { FlowNode, FlowNodeType, LandingPageDoc, ContactForm, ThankYouPage, ChatBot } from "../../types";

interface Props {
  node: FlowNode;
  onUpdate: (data: Partial<FlowNode["data"]>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function FlowNodePropertiesPanel({ node, onUpdate, onDelete, onClose }: Props) {
  const def = FLOW_NODE_DEFINITIONS[node.type as FlowNodeType];
  const [landings, setLandings] = useState<LandingPageDoc[]>([]);
  const [forms, setForms] = useState<ContactForm[]>([]);
  const [thankYous, setThankYous] = useState<ThankYouPage[]>([]);
  const [chatBots, setChatBots] = useState<ChatBot[]>([]);

  useEffect(() => {
    (async () => {
      const [l, f, t, b] = await Promise.all([
        funnelService.getLandings(),
        funnelService.getContactForms(),
        funnelService.getThankYouPages(),
        chatService.getChatBots(),
      ]);
      setLandings(l);
      setForms(f);
      setThankYous(t);
      setChatBots(b);
    })();
  }, []);

  const config = (node.data?.config || {}) as any;
  const updateConfig = (patch: any) => onUpdate({ config: { ...config, ...patch } });

  return (
    <aside className="w-96 bg-white border-l-2 overflow-y-auto flex-shrink-0">
      <div className="p-4 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{def.icon}</span>
          <div>
            <h3 className="font-black text-sm">{def.label}</h3>
            <p className="text-[10px] text-gray-500">{def.description}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <FieldCard label="Etichetta">
          <input
            type="text"
            value={node.data?.label || ""}
            onChange={e => onUpdate({ label: e.target.value })}
            className="input"
          />
        </FieldCard>

        <FieldCard label="Descrizione (opzionale)">
          <textarea
            value={node.data?.description || ""}
            onChange={e => onUpdate({ description: e.target.value })}
            className="input"
            rows={2}
          />
        </FieldCard>

        {/* CONFIGURAZIONE PER TIPO */}
        {node.type === "landing" && (
          <FieldCard label="Landing collegata">
            <select value={config.landingId || ""} onChange={e => updateConfig({ landingId: e.target.value })} className="input">
              <option value="">— Seleziona —</option>
              {landings.map(l => <option key={l.id} value={l.id}>{l.internalName}</option>)}
            </select>
          </FieldCard>
        )}

        {node.type === "form" && (
          <FieldCard label="Modulo collegato">
            <select value={config.formId || ""} onChange={e => updateConfig({ formId: e.target.value })} className="input">
              <option value="">— Seleziona —</option>
              {forms.map(f => <option key={f.id} value={f.id}>{f.internalName}</option>)}
            </select>
          </FieldCard>
        )}

        {node.type === "thank_you" && (
          <FieldCard label="Thank You Page collegata">
            <select value={config.thankYouPageId || ""} onChange={e => updateConfig({ thankYouPageId: e.target.value })} className="input">
              <option value="">— Seleziona —</option>
              {thankYous.map(t => <option key={t.id} value={t.id}>{t.internalName}</option>)}
            </select>
          </FieldCard>
        )}

        {node.type === "chat_ai" && (
          <FieldCard label="Chat AI collegata">
            <select value={config.chatBotId || ""} onChange={e => updateConfig({ chatBotId: e.target.value })} className="input">
              <option value="">— Seleziona —</option>
              {chatBots.map(c => <option key={c.id} value={c.id}>{c.internalName}</option>)}
            </select>
          </FieldCard>
        )}

        {node.type === "question" && (
          <>
            <FieldCard label="Testo domanda">
              <textarea
                value={config.questionText || ""}
                onChange={e => updateConfig({ questionText: e.target.value })}
                className="input"
                rows={2}
              />
            </FieldCard>
            <FieldCard label="Opzioni di risposta">
              <OptionsEditor
                options={config.options || []}
                onChange={opts => updateConfig({ options: opts })}
              />
            </FieldCard>
          </>
        )}

        {node.type === "delay" && (
          <FieldCard label="Durata attesa">
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                value={config.amount || 1}
                onChange={e => updateConfig({ amount: parseInt(e.target.value) || 1 })}
                className="input flex-1"
              />
              <select value={config.unit || "hours"} onChange={e => updateConfig({ unit: e.target.value })} className="input flex-1">
                <option value="minutes">minuti</option>
                <option value="hours">ore</option>
                <option value="days">giorni</option>
              </select>
            </div>
          </FieldCard>
        )}

        {node.type === "condition" && (
          <>
            <FieldCard label="Campo da controllare">
              <select value={config.rule || "tag"} onChange={e => updateConfig({ rule: e.target.value })} className="input">
                <option value="tag">Tag del lead</option>
                <option value="level">Livello funnel</option>
                <option value="answer">Risposta precedente</option>
                <option value="email">Email presente</option>
                <option value="phone">Telefono presente</option>
              </select>
            </FieldCard>
            <FieldCard label="Operatore">
              <select value={config.operator || "contains"} onChange={e => updateConfig({ operator: e.target.value })} className="input">
                <option value="equals">è uguale a</option>
                <option value="contains">contiene</option>
                <option value="not_equals">è diverso da</option>
                <option value="exists">esiste</option>
              </select>
            </FieldCard>
            <FieldCard label="Valore">
              <input
                type="text"
                value={config.value || ""}
                onChange={e => updateConfig({ value: e.target.value })}
                className="input"
              />
            </FieldCard>
          </>
        )}

        {node.type === "action_email" && (
          <>
            <FieldCard label="Destinatario">
              <select value={config.to || "lead"} onChange={e => updateConfig({ to: e.target.value })} className="input">
                <option value="lead">Al lead</option>
                <option value="studio">Allo studio</option>
                <option value="custom">Email personalizzata</option>
              </select>
            </FieldCard>
            {config.to === "custom" && (
              <FieldCard label="Email destinatario">
                <input type="email" value={config.customEmail || ""} onChange={e => updateConfig({ customEmail: e.target.value })} className="input" />
              </FieldCard>
            )}
            <FieldCard label="Oggetto">
              <input type="text" value={config.subject || ""} onChange={e => updateConfig({ subject: e.target.value })} className="input" />
            </FieldCard>
            <FieldCard label="Corpo (testo)">
              <textarea value={config.body || ""} onChange={e => updateConfig({ body: e.target.value })} className="input" rows={4} />
            </FieldCard>
          </>
        )}

        {node.type === "action_tag" && (
          <FieldCard label="Tag da aggiungere">
            <TagsEditor tags={config.tags || []} onChange={tags => updateConfig({ tags })} />
          </FieldCard>
        )}

        {node.type === "action_level" && (
          <FieldCard label="Nuovo livello funnel">
            <select value={config.newLevel || "lead_caldo"} onChange={e => updateConfig({ newLevel: e.target.value })} className="input">
              {FUNNEL_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </FieldCard>
        )}

        {node.type === "action_notify" && (
          <>
            <FieldCard label="Email destinatario">
              <input type="email" value={config.recipient || ""} onChange={e => updateConfig({ recipient: e.target.value })} className="input" placeholder="studio@esempio.it" />
            </FieldCard>
            <FieldCard label="Oggetto">
              <input type="text" value={config.subject || ""} onChange={e => updateConfig({ subject: e.target.value })} className="input" />
            </FieldCard>
          </>
        )}

        {node.type === "action_webhook" && (
          <>
            <FieldCard label="URL">
              <input type="url" value={config.url || ""} onChange={e => updateConfig({ url: e.target.value })} className="input" />
            </FieldCard>
            <FieldCard label="Metodo HTTP">
              <select value={config.method || "POST"} onChange={e => updateConfig({ method: e.target.value })} className="input">
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
              </select>
            </FieldCard>
          </>
        )}

        {node.type === "redirect" && (
          <FieldCard label="URL di destinazione">
            <input type="url" value={config.url || ""} onChange={e => updateConfig({ url: e.target.value })} className="input" placeholder="https://..." />
          </FieldCard>
        )}

        <button
          onClick={onDelete}
          className="w-full mt-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100"
        >
          <Trash2 size={14} /> Elimina nodo
        </button>
      </div>

      <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; border: 2px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.8125rem; } .input:focus { outline: none; border-color: #3b82f6; }`}</style>
    </aside>
  );
}

function FieldCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1">{label}</label>
      {children}
    </div>
  );
}

function OptionsEditor({ options, onChange }: { options: any[]; onChange: (opts: any[]) => void }) {
  const updateOpt = (i: number, patch: any) => onChange(options.map((o, idx) => idx === i ? { ...o, ...patch } : o));
  const removeOpt = (i: number) => onChange(options.filter((_, idx) => idx !== i));
  const addOpt = () => onChange([...options, { id: `opt_${Date.now()}`, label: "Nuova opzione", value: "" }]);

  return (
    <div className="space-y-2">
      {options.map((opt, i) => (
        <div key={opt.id || i} className="flex gap-1 items-center">
          <input type="text" value={opt.label || ""} onChange={e => updateOpt(i, { label: e.target.value })} className="input flex-1" placeholder="Etichetta" />
          <button onClick={() => removeOpt(i)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={12} /></button>
        </div>
      ))}
      <button onClick={addOpt} className="w-full py-1.5 border-2 border-dashed rounded-lg text-xs font-bold text-gray-600 hover:border-blue-400 flex items-center justify-center gap-1">
        <Plus size={12} /> Aggiungi opzione
      </button>
    </div>
  );
}

function TagsEditor({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");
  const addTag = () => {
    if (input.trim()) {
      onChange([...tags, input.trim()]);
      setInput("");
    }
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {tags.map((t, i) => (
          <span key={i} className="text-[11px] px-2 py-1 bg-blue-100 text-blue-800 rounded-lg flex items-center gap-1 font-bold">
            {t}
            <button onClick={() => onChange(tags.filter((_, idx) => idx !== i))} className="hover:bg-blue-200 rounded">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} className="input flex-1" placeholder="Nuovo tag..." />
        <button onClick={addTag} className="px-3 bg-blue-600 text-white rounded-lg text-xs font-bold">+</button>
      </div>
    </div>
  );
}
