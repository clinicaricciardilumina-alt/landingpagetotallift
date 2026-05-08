import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import * as funnelService from "../../lib/funnelService";
import type { ThankYouPage } from "../../types";

export default function ThankYouPagesManager() {
  const [pages, setPages] = useState<ThankYouPage[]>([]);
  const [editing, setEditing] = useState<ThankYouPage | null>(null);

  const refresh = async () => setPages(await funnelService.getThankYouPages());
  useEffect(() => { refresh(); }, []);

  const create = async () => {
    const created = await funnelService.addThankYouPage({
      internalName: "Nuova Thank You",
      title: "Grazie!",
      message: "La tua richiesta è stata ricevuta. Ti contatteremo al più presto.",
      showBooking: false,
      showSocialShare: false,
      createdAt: new Date().toISOString(),
    });
    refresh();
    setEditing(created);
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminare questa Thank You Page?")) return;
    await funnelService.deleteThankYouPage(id);
    refresh();
  };

  if (editing) {
    return <ThankYouEditor page={editing} onClose={() => { setEditing(null); refresh(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Thank You Pages</h2>
          <p className="text-gray-500 text-sm">Pagine di ringraziamento mostrate dopo invio modulo o quiz</p>
        </div>
        <button onClick={create} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2">
          <Plus size={18} /> Nuova Thank You
        </button>
      </div>

      <div className="grid gap-3">
        {pages.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed">
            <p className="text-gray-500">Nessuna Thank You Page ancora.</p>
          </div>
        ) : pages.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-bold">{p.internalName}</h3>
              <p className="text-xs text-gray-500">{p.title} · {p.showBooking ? "con prenotazione" : "senza prenotazione"}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(p)} className="p-2 rounded-lg hover:bg-gray-100"><Edit2 size={18} /></button>
              <button onClick={() => remove(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThankYouEditor({ page, onClose }: { page: ThankYouPage; onClose: () => void }) {
  const [data, setData] = useState<ThankYouPage>(page);
  const [savedMsg, setSavedMsg] = useState("");

  const save = async () => {
    await funnelService.updateThankYouPage(page.id, data);
    setSavedMsg("Salvato!");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="px-4 py-2 border-2 rounded-xl font-bold">← Indietro</button>
          <h2 className="text-2xl font-black">Modifica Thank You</h2>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-green-600 font-bold">{savedMsg}</span>}
          <button onClick={save} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold">Salva</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl space-y-4">
        <div>
          <label className="block text-sm font-bold mb-1">Nome interno</label>
          <input type="text" value={data.internalName} onChange={e => setData({...data, internalName: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Titolo</label>
          <input type="text" value={data.title} onChange={e => setData({...data, title: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Messaggio</label>
          <textarea value={data.message} onChange={e => setData({...data, message: e.target.value})} className="w-full p-3 border-2 rounded-xl" rows={4} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={data.showBooking} onChange={e => setData({...data, showBooking: e.target.checked})} />
            <span className="text-sm font-bold">Mostra prenotazione slot</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={data.showSocialShare} onChange={e => setData({...data, showSocialShare: e.target.checked})} />
            <span className="text-sm font-bold">Mostra share social</span>
          </label>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">CTA Text (opzionale)</label>
            <input type="text" value={data.ctaText || ""} onChange={e => setData({...data, ctaText: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">CTA URL</label>
            <input type="url" value={data.ctaUrl || ""} onChange={e => setData({...data, ctaUrl: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Redirect URL (opzionale)</label>
            <input type="url" value={data.redirectUrl || ""} onChange={e => setData({...data, redirectUrl: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Delay redirect (sec)</label>
            <input type="number" value={data.redirectDelaySeconds || 0} onChange={e => setData({...data, redirectDelaySeconds: parseInt(e.target.value) || 0})} className="w-full p-3 border-2 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
