import React, { useEffect, useState } from "react";
import { Plus, Trash2, Calendar } from "lucide-react";
import * as funnelService from "../../lib/funnelService";
import type { BookingSlot, LandingPageDoc, Funnel } from "../../types";

export default function SlotsManager() {
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [landings, setLandings] = useState<LandingPageDoc[]>([]);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [showBulk, setShowBulk] = useState(false);

  const refresh = async () => {
    setSlots(await funnelService.getBookingSlots());
    setLandings(await funnelService.getLandings());
    setFunnels(await funnelService.getFunnels());
  };
  useEffect(() => { refresh(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Eliminare questo slot?")) return;
    await funnelService.deleteBookingSlot(id);
    refresh();
  };

  const toggleStatus = async (slot: BookingSlot) => {
    const newStatus = slot.status === "disattivato" ? "disponibile" : "disattivato";
    await funnelService.updateBookingSlot(slot.id, { status: newStatus, isBlocked: newStatus === "disattivato" });
    refresh();
  };

  // group by date
  const grouped = slots.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {} as Record<string, BookingSlot[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Slot Prenotazione</h2>
          <p className="text-gray-500 text-sm">Gestisci giorni e orari disponibili per le prenotazioni</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBulk(true)} className="px-5 py-3 border-2 rounded-xl font-bold flex items-center gap-2">
            <Calendar size={18} /> Genera in massa
          </button>
          <button onClick={() => setShowNew(true)} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2">
            <Plus size={18} /> Nuovo Slot
          </button>
        </div>
      </div>

      {showNew && <NewSlotModal landings={landings} funnels={funnels} onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); refresh(); }} />}
      {showBulk && <BulkSlotModal landings={landings} funnels={funnels} onClose={() => setShowBulk(false)} onCreated={() => { setShowBulk(false); refresh(); }} />}

      <div className="space-y-4">
        {Object.keys(grouped).length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed">
            <p className="text-gray-500">Nessuno slot ancora. Crea slot singoli o genera in massa.</p>
          </div>
        ) : Object.keys(grouped).sort().map(date => (
          <div key={date} className="bg-white p-4 rounded-2xl">
            <h3 className="font-black mb-3">{date}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {grouped[date].sort((a, b) => a.time.localeCompare(b.time)).map(slot => (
                <div key={slot.id} className={`p-3 rounded-lg border-2 ${
                  slot.status === "disponibile" ? "border-green-200 bg-green-50" :
                  slot.status === "pieno" ? "border-orange-200 bg-orange-50" :
                  "border-gray-200 bg-gray-50 opacity-60"
                }`}>
                  <div className="font-bold">{slot.time}</div>
                  <div className="text-xs text-gray-600">{slot.currentBookings}/{slot.maxBookings}</div>
                  <div className="text-xs">{slot.status}</div>
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => toggleStatus(slot)} className="text-xs flex-1 px-2 py-1 bg-white rounded border">
                      {slot.status === "disattivato" ? "Attiva" : "Disattiva"}
                    </button>
                    <button onClick={() => remove(slot.id)} className="px-2 py-1 text-red-600">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewSlotModal({ landings, funnels, onClose, onCreated }: any) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(30);
  const [maxBookings, setMaxBookings] = useState(1);
  const [appointmentType, setAppointmentType] = useState("");
  const [landingId, setLandingId] = useState("");
  const [funnelId, setFunnelId] = useState("");

  const create = async () => {
    if (!date || !time) return;
    await funnelService.addBookingSlot({
      date, time, duration, maxBookings, currentBookings: 0,
      appointmentType: appointmentType || undefined,
      landingId: landingId || undefined,
      funnelId: funnelId || undefined,
      status: "disponibile",
      isBlocked: false,
      createdAt: new Date().toISOString(),
    });
    onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white p-8 rounded-3xl max-w-lg w-full">
        <h3 className="text-xl font-black mb-4">Nuovo Slot</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-3 border-2 rounded-xl" />
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="p-3 border-2 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold">Durata (min)</label>
              <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 30)} className="w-full p-3 border-2 rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-bold">Posti max</label>
              <input type="number" value={maxBookings} onChange={e => setMaxBookings(parseInt(e.target.value) || 1)} className="w-full p-3 border-2 rounded-xl" />
            </div>
          </div>
          <input type="text" placeholder="Tipo appuntamento (opzionale)" value={appointmentType} onChange={e => setAppointmentType(e.target.value)} className="w-full p-3 border-2 rounded-xl" />
          <select value={landingId} onChange={e => setLandingId(e.target.value)} className="w-full p-3 border-2 rounded-xl">
            <option value="">Tutte le landing</option>
            {landings.map((l: LandingPageDoc) => <option key={l.id} value={l.id}>{l.internalName}</option>)}
          </select>
          <select value={funnelId} onChange={e => setFunnelId(e.target.value)} className="w-full p-3 border-2 rounded-xl">
            <option value="">Tutti i funnel</option>
            {funnels.map((f: Funnel) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border-2 rounded-xl font-bold">Annulla</button>
          <button onClick={create} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold">Crea Slot</button>
        </div>
      </div>
    </div>
  );
}

function BulkSlotModal({ landings, funnels, onClose, onCreated }: any) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [morningStart, setMorningStart] = useState("09:00");
  const [morningEnd, setMorningEnd] = useState("12:00");
  const [afternoonStart, setAfternoonStart] = useState("15:00");
  const [afternoonEnd, setAfternoonEnd] = useState("18:00");
  const [duration, setDuration] = useState(30);
  const [maxBookings, setMaxBookings] = useState(1);
  const [generating, setGenerating] = useState(false);

  const dayNames = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

  const generate = async () => {
    if (!startDate || !endDate) return;
    setGenerating(true);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const datesList: string[] = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (days.includes(d.getDay())) {
          datesList.push(d.toISOString().split("T")[0]);
        }
      }

      const generateTimes = (s: string, e: string) => {
        const times: string[] = [];
        const [sh, sm] = s.split(":").map(Number);
        const [eh, em] = e.split(":").map(Number);
        let cur = sh * 60 + sm;
        const endMin = eh * 60 + em;
        while (cur + duration <= endMin) {
          times.push(`${String(Math.floor(cur / 60)).padStart(2, "0")}:${String(cur % 60).padStart(2, "0")}`);
          cur += duration;
        }
        return times;
      };

      for (const date of datesList) {
        const allTimes = [
          ...(morningStart && morningEnd ? generateTimes(morningStart, morningEnd) : []),
          ...(afternoonStart && afternoonEnd ? generateTimes(afternoonStart, afternoonEnd) : []),
        ];
        for (const time of allTimes) {
          await funnelService.addBookingSlot({
            date, time, duration, maxBookings, currentBookings: 0,
            status: "disponibile", isBlocked: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
      onCreated();
    } catch (e) {
      console.error(e);
      alert("Errore durante la generazione");
    }
    setGenerating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white p-8 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-black mb-4">Genera Slot in Massa</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold">Da</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 border-2 rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-bold">A</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3 border-2 rounded-xl" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold">Giorni della settimana</label>
            <div className="flex gap-2 mt-2">
              {dayNames.map((name, i) => (
                <button
                  key={i}
                  onClick={() => setDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i])}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm ${days.includes(i) ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold">Mattina</label>
              <div className="flex gap-2">
                <input type="time" value={morningStart} onChange={e => setMorningStart(e.target.value)} className="flex-1 p-2 border-2 rounded-xl" />
                <input type="time" value={morningEnd} onChange={e => setMorningEnd(e.target.value)} className="flex-1 p-2 border-2 rounded-xl" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold">Pomeriggio</label>
              <div className="flex gap-2">
                <input type="time" value={afternoonStart} onChange={e => setAfternoonStart(e.target.value)} className="flex-1 p-2 border-2 rounded-xl" />
                <input type="time" value={afternoonEnd} onChange={e => setAfternoonEnd(e.target.value)} className="flex-1 p-2 border-2 rounded-xl" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold">Durata slot (min)</label>
              <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 30)} className="w-full p-3 border-2 rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-bold">Posti per slot</label>
              <input type="number" value={maxBookings} onChange={e => setMaxBookings(parseInt(e.target.value) || 1)} className="w-full p-3 border-2 rounded-xl" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border-2 rounded-xl font-bold">Annulla</button>
          <button onClick={generate} disabled={generating} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50">
            {generating ? "Generazione..." : "Genera Slot"}
          </button>
        </div>
      </div>
    </div>
  );
}
