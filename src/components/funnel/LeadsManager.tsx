import React, { useEffect, useState, useMemo } from "react";
import { Trash2, Eye, Phone, Mail, Calendar, Tag } from "lucide-react";
import * as funnelService from "../../lib/funnelService";
import { LEAD_STATUSES, FUNNEL_LEVELS } from "../../types";
import type { Lead, LeadStatus, FunnelLevel, LandingPageDoc, Funnel } from "../../types";

export default function LeadsManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [landings, setLandings] = useState<LandingPageDoc[]>([]);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  // filtri
  const [filterLanding, setFilterLanding] = useState<string>("");
  const [filterFunnel, setFilterFunnel] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterLevel, setFilterLevel] = useState<string>("");
  const [filterTag, setFilterTag] = useState<string>("");
  const [searchText, setSearchText] = useState("");

  const refresh = async () => {
    setLoading(true);
    setLeads(await funnelService.getLeads());
    setLandings(await funnelService.getLandings());
    setFunnels(await funnelService.getFunnels());
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Eliminare questo lead? Operazione irreversibile.")) return;
    await funnelService.deleteLead(id);
    if (selected?.id === id) setSelected(null);
    refresh();
  };

  const updateStatus = async (lead: Lead, status: LeadStatus) => {
    await funnelService.updateLeadStatus(lead.id, status);
    const updated = await funnelService.getLeadById(lead.id);
    if (updated && selected?.id === lead.id) setSelected(updated);
    refresh();
  };

  const updateLevel = async (lead: Lead, level: FunnelLevel) => {
    await funnelService.updateLeadLevel(lead.id, level);
    const updated = await funnelService.getLeadById(lead.id);
    if (updated && selected?.id === lead.id) setSelected(updated);
    refresh();
  };

  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (filterLanding && l.landingId !== filterLanding) return false;
      if (filterFunnel && l.funnelId !== filterFunnel) return false;
      if (filterStatus && l.status !== filterStatus) return false;
      if (filterLevel && l.funnelLevel !== filterLevel) return false;
      if (filterTag && !l.tags?.some(t => t.toLowerCase().includes(filterTag.toLowerCase()))) return false;
      if (searchText) {
        const s = searchText.toLowerCase();
        const inName = (l.firstName + " " + (l.lastName || "")).toLowerCase().includes(s);
        const inPhone = (l.phone || "").toLowerCase().includes(s);
        const inEmail = (l.email || "").toLowerCase().includes(s);
        if (!inName && !inPhone && !inEmail) return false;
      }
      return true;
    }).sort((a, b) => (b.acquiredAt || "").localeCompare(a.acquiredAt || ""));
  }, [leads, filterLanding, filterFunnel, filterStatus, filterLevel, filterTag, searchText]);

  // Stats
  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter(l => l.status === "nuovo").length,
    booked: leads.filter(l => l.status === "appuntamento_prenotato").length,
    converted: leads.filter(l => l.status === "convertito").length,
  }), [leads]);

  if (selected) {
    return <LeadDetail lead={selected} onClose={() => setSelected(null)} onStatusChange={s => updateStatus(selected, s)} onLevelChange={l => updateLevel(selected, l)} onDelete={() => remove(selected.id)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Lead Management</h2>
          <p className="text-gray-500 text-sm">Tutti i contatti generati dalle landing</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border-l-4 border-blue-500">
          <div className="text-xs font-bold text-gray-400 uppercase">Totale Lead</div>
          <div className="text-3xl font-black text-blue-600">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border-l-4 border-yellow-500">
          <div className="text-xs font-bold text-gray-400 uppercase">Nuovi</div>
          <div className="text-3xl font-black text-yellow-600">{stats.new}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border-l-4 border-purple-500">
          <div className="text-xs font-bold text-gray-400 uppercase">Prenotati</div>
          <div className="text-3xl font-black text-purple-600">{stats.booked}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border-l-4 border-green-500">
          <div className="text-xs font-bold text-gray-400 uppercase">Convertiti</div>
          <div className="text-3xl font-black text-green-600">{stats.converted}</div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white p-4 rounded-2xl">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <input type="text" placeholder="Cerca nome/email/telefono..." value={searchText} onChange={e => setSearchText(e.target.value)} className="col-span-2 md:col-span-2 p-2 border-2 rounded-lg text-sm" />
          <select value={filterLanding} onChange={e => setFilterLanding(e.target.value)} className="p-2 border-2 rounded-lg text-sm">
            <option value="">Tutte le landing</option>
            {landings.map(l => <option key={l.id} value={l.id}>{l.internalName}</option>)}
          </select>
          <select value={filterFunnel} onChange={e => setFilterFunnel(e.target.value)} className="p-2 border-2 rounded-lg text-sm">
            <option value="">Tutti i funnel</option>
            {funnels.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="p-2 border-2 rounded-lg text-sm">
            <option value="">Tutti gli stati</option>
            {LEAD_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="p-2 border-2 rounded-lg text-sm">
            <option value="">Tutti i livelli</option>
            {FUNNEL_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
        <input type="text" placeholder="Filtra per tag..." value={filterTag} onChange={e => setFilterTag(e.target.value)} className="w-full mt-2 p-2 border-2 rounded-lg text-sm" />
      </div>

      {/* Lista */}
      {loading ? (
        <p>Caricamento...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed">
          <p className="text-gray-500">Nessun lead trovato con questi filtri.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-bold text-gray-600 uppercase">
              <tr>
                <th className="p-3 text-left">Nome</th>
                <th className="p-3 text-left">Contatto</th>
                <th className="p-3 text-left">Provenienza</th>
                <th className="p-3 text-left">Livello</th>
                <th className="p-3 text-left">Stato</th>
                <th className="p-3 text-left">Data</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => {
                const statusInfo = LEAD_STATUSES.find(s => s.value === lead.status);
                const levelInfo = FUNNEL_LEVELS.find(l => l.value === lead.funnelLevel);
                return (
                  <tr key={lead.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(lead)}>
                    <td className="p-3 font-bold">{lead.firstName} {lead.lastName}</td>
                    <td className="p-3">
                      {lead.phone && <div className="flex items-center gap-1 text-xs"><Phone size={12} /> {lead.phone}</div>}
                      {lead.email && <div className="flex items-center gap-1 text-xs text-gray-500"><Mail size={12} /> {lead.email}</div>}
                    </td>
                    <td className="p-3 text-xs">{lead.landingName || "-"}</td>
                    <td className="p-3">
                      {levelInfo && (
                        <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: levelInfo.color + "33", color: levelInfo.color }}>
                          {levelInfo.label}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {statusInfo && (
                        <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: statusInfo.color + "33", color: statusInfo.color }}>
                          {statusInfo.label}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-gray-500">{lead.acquiredAt ? new Date(lead.acquiredAt).toLocaleDateString("it-IT") : "-"}</td>
                    <td className="p-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button onClick={() => setSelected(lead)} className="p-1 text-blue-600"><Eye size={16} /></button>
                        <button onClick={() => remove(lead.id)} className="p-1 text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LeadDetail({ lead, onClose, onStatusChange, onLevelChange, onDelete }: {
  lead: Lead; onClose: () => void;
  onStatusChange: (s: LeadStatus) => void;
  onLevelChange: (l: FunnelLevel) => void;
  onDelete: () => void;
}) {
  const [notes, setNotes] = useState(lead.internalNotes || "");
  const [savedMsg, setSavedMsg] = useState("");

  const saveNotes = async () => {
    await funnelService.updateLead(lead.id, { internalNotes: notes });
    await funnelService.addLeadActionLog(lead.id, {
      type: "note_added",
      description: "Note interne aggiornate",
      timestamp: new Date().toISOString(),
    });
    setSavedMsg("Note salvate!");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="px-4 py-2 border-2 rounded-xl font-bold">← Lista</button>
          <h2 className="text-2xl font-black">{lead.firstName} {lead.lastName}</h2>
        </div>
        <button onClick={onDelete} className="px-4 py-2 bg-red-100 text-red-700 rounded-xl font-bold flex items-center gap-2">
          <Trash2 size={16} /> Elimina lead
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Info Lead */}
        <div className="bg-white p-6 rounded-2xl">
          <h3 className="font-black text-lg mb-4">Dati Contatto</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Nome:</strong> {lead.firstName} {lead.lastName}</div>
            <div><strong>Telefono:</strong> {lead.phone || "-"}</div>
            <div><strong>Email:</strong> {lead.email || "-"}</div>
            <div><strong>Privacy:</strong> {lead.privacyConsent ? "✅" : "❌"}</div>
            <div><strong>Marketing:</strong> {lead.marketingConsent ? "✅" : "❌"}</div>
          </div>
        </div>

        {/* Provenienza */}
        <div className="bg-white p-6 rounded-2xl">
          <h3 className="font-black text-lg mb-4">Provenienza</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Landing:</strong> {lead.landingName || "-"}</div>
            <div><strong>Funnel:</strong> {lead.funnelName || "-"}</div>
            <div><strong>Acquisito il:</strong> {lead.acquiredAt ? new Date(lead.acquiredAt).toLocaleString("it-IT") : "-"}</div>
            {lead.bookingDate && <div><strong>Appuntamento:</strong> {lead.bookingDate} {lead.bookingTime}</div>}
          </div>
        </div>

        {/* Stato e Livello */}
        <div className="bg-white p-6 rounded-2xl md:col-span-2">
          <h3 className="font-black text-lg mb-4">Gestione</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">Stato Lead</label>
              <select value={lead.status} onChange={e => onStatusChange(e.target.value as LeadStatus)} className="w-full p-3 border-2 rounded-xl">
                {LEAD_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Livello Funnel</label>
              <select value={lead.funnelLevel} onChange={e => onLevelChange(e.target.value as FunnelLevel)} className="w-full p-3 border-2 rounded-xl">
                {FUNNEL_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Tags */}
        {lead.tags && lead.tags.length > 0 && (
          <div className="bg-white p-6 rounded-2xl md:col-span-2">
            <h3 className="font-black text-lg mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {lead.tags.map((t, i) => (
                <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                  <Tag size={12} className="inline mr-1" />{t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Risposte quiz */}
        {lead.answers && Object.keys(lead.answers).length > 0 && (
          <div className="bg-white p-6 rounded-2xl">
            <h3 className="font-black text-lg mb-4">Risposte Quiz</h3>
            <div className="space-y-2 text-sm">
              {Object.entries(lead.answers).map(([k, v]) => (
                <div key={k} className="border-b pb-2">
                  <div className="text-xs text-gray-500">{k}</div>
                  <div className="font-bold">{String(v)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dati form */}
        {lead.formData && Object.keys(lead.formData).length > 0 && (
          <div className="bg-white p-6 rounded-2xl">
            <h3 className="font-black text-lg mb-4">Dati Modulo</h3>
            <div className="space-y-2 text-sm">
              {Object.entries(lead.formData).map(([k, v]) => (
                <div key={k} className="border-b pb-2">
                  <div className="text-xs text-gray-500">{k}</div>
                  <div className="font-bold">{String(v)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note interne */}
        <div className="bg-white p-6 rounded-2xl md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-lg">Note interne</h3>
            <div className="flex items-center gap-3">
              {savedMsg && <span className="text-green-600 text-sm font-bold">{savedMsg}</span>}
              <button onClick={saveNotes} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm">Salva note</button>
            </div>
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3 border-2 rounded-xl" rows={4} placeholder="Aggiungi note sul lead, conversazioni telefoniche, ecc..." />
        </div>

        {/* Storico */}
        <div className="bg-white p-6 rounded-2xl md:col-span-2">
          <h3 className="font-black text-lg mb-4">Storico azioni</h3>
          <div className="space-y-2">
            {(lead.actionLog || []).slice().reverse().map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                <Calendar size={14} className="text-gray-400 mt-1" />
                <div className="flex-1">
                  <div className="font-bold">{log.description}</div>
                  <div className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString("it-IT")}</div>
                </div>
              </div>
            ))}
            {(!lead.actionLog || lead.actionLog.length === 0) && (
              <p className="text-gray-400 italic text-sm">Nessuna azione registrata</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
