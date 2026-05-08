import React, { useEffect, useState } from "react";
import { ChevronLeft, MessageCircle, User } from "lucide-react";
import * as chatService from "../../lib/chatService";
import type { ChatBot, ChatConversation } from "../../types";

export default function ChatConversationsViewer({ bot, onClose }: { bot: ChatBot; onClose: () => void }) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selected, setSelected] = useState<ChatConversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setConversations(await chatService.getConversationsByBot(bot.id));
      setLoading(false);
    })();
  }, [bot.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onClose} className="px-4 py-2 border-2 rounded-xl font-bold flex items-center gap-1">
          <ChevronLeft size={16} /> Indietro
        </button>
        <h2 className="text-2xl font-black">Conversazioni: {bot.internalName}</h2>
      </div>

      {loading ? (
        <p>Caricamento...</p>
      ) : conversations.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed">
          <MessageCircle size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Nessuna conversazione ancora.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl divide-y max-h-[80vh] overflow-y-auto">
            {conversations.map(c => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full p-4 text-left hover:bg-gray-50 ${selected?.id === c.id ? "bg-blue-50" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-sm">
                    {c.visitorFirstName || "Visitatore anonimo"}
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {new Date(c.startedAt).toLocaleDateString("it-IT")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-1">
                  {c.classification && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      c.classification === "urgente" ? "bg-red-100 text-red-700" :
                      c.classification === "caldo" ? "bg-orange-100 text-orange-700" :
                      c.classification === "tiepido" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {c.classification}
                    </span>
                  )}
                  {c.leadCreated && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-green-100 text-green-700">
                      ✓ Lead
                    </span>
                  )}
                  {c.detectedUrgency && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-red-100 text-red-700">
                      ⚠ Urgenza
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {c.messages.length} messaggi · {c.landingName || "—"}
                </div>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-4 max-h-[80vh] overflow-y-auto">
            {!selected ? (
              <div className="text-center py-12 text-gray-400">
                ← Seleziona una conversazione
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border-b pb-3 mb-3">
                  <h3 className="font-black mb-1">
                    {selected.visitorFirstName || "Visitatore anonimo"}
                  </h3>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    {selected.visitorPhone && <div>📞 {selected.visitorPhone}</div>}
                    {selected.visitorEmail && <div>✉ {selected.visitorEmail}</div>}
                    <div>📅 {new Date(selected.startedAt).toLocaleString("it-IT")}</div>
                    {selected.detectedTags?.length > 0 && (
                      <div>🏷 {selected.detectedTags.join(", ")}</div>
                    )}
                  </div>
                </div>

                {selected.messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] p-2.5 rounded-xl text-xs ${
                      m.role === "user" ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-900"
                    }`}>
                      <div className="font-bold text-[10px] uppercase mb-0.5 opacity-70">
                        {m.role === "user" ? "Utente" : bot.botName}
                      </div>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
