import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Upload, Trash2, Edit2, Copy, Check, X, Search,
  Image as ImageIcon, Tag, Loader, AlertCircle,
} from "lucide-react";
import * as service from "../../lib/imageLibraryService";
import type { LibraryImage, ImageCategory } from "../../types";

const CATEGORIES: { value: ImageCategory; label: string; emoji: string }[] = [
  { value: "hero", label: "Hero/Copertina", emoji: "🌟" },
  { value: "logo", label: "Logo", emoji: "🏷️" },
  { value: "team", label: "Team/Staff", emoji: "👥" },
  { value: "studio", label: "Studio/Interni", emoji: "🏢" },
  { value: "prima_dopo", label: "Prima/Dopo", emoji: "✨" },
  { value: "treatments", label: "Trattamenti", emoji: "🦷" },
  { value: "icons", label: "Icone", emoji: "🔣" },
  { value: "social", label: "Social", emoji: "📱" },
  { value: "altro", label: "Altro", emoji: "📦" },
];

export default function ImageLibraryManager() {
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<ImageCategory | "">("");
  const [searchText, setSearchText] = useState("");
  const [editing, setEditing] = useState<LibraryImage | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    setLoading(true);
    setImages(await service.getLibraryImages());
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    return service.filterImages(images, {
      category: filterCategory || undefined,
      searchText: searchText || undefined,
    });
  }, [images, filterCategory, searchText]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);

    let successCount = 0;
    let errorMsg = "";

    for (const file of Array.from(files)) {
      const res = await service.uploadAndSaveToLibrary(file, {
        name: file.name.replace(/\.[^.]+$/, ""),
        category: "altro",
        tags: [],
      });
      if (res.ok) successCount++;
      else if (!errorMsg) errorMsg = res.error || "Errore sconosciuto";
    }

    if (errorMsg) setUploadError(errorMsg);
    if (successCount > 0) await refresh();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const remove = async (img: LibraryImage) => {
    if (!confirm(`Eliminare "${img.name}"? Verrà rimossa solo dall'archivio (resta su Cloudinary).`)) return;
    await service.deleteLibraryImage(img.id);
    refresh();
  };

  if (editing) {
    return <ImageEditor image={editing} onClose={() => { setEditing(null); refresh(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Archivio Immagini</h2>
          <p className="text-gray-500 text-sm">{images.length} immagini caricate · Cloud: Cloudinary</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={e => handleUpload(e.target.files)}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {uploading ? <Loader size={18} className="animate-spin" /> : <Upload size={18} />}
            {uploading ? "Caricamento..." : "Carica immagini"}
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong>Errore upload:</strong> {uploadError}
          </div>
          <button onClick={() => setUploadError(null)} className="text-gray-500"><X size={16} /></button>
        </div>
      )}

      {/* FILTRI */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Cerca per nome, descrizione, tag..."
            className="w-full pl-9 pr-3 py-2 border-2 rounded-xl text-sm"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value as any)}
          className="px-3 py-2 border-2 rounded-xl text-sm font-bold"
        >
          <option value="">Tutte le categorie</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
        </select>
      </div>

      {loading ? (
        <p>Caricamento...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed">
          <ImageIcon size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-xl font-black mb-2">
            {images.length === 0 ? "Nessuna immagine ancora" : "Nessun risultato"}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {images.length === 0
              ? "Carica le prime immagini (logo, foto studio, team). Le potrai riusare in tutte le landing."
              : "Modifica i filtri per trovare l'immagine giusta."
            }
          </p>
          {images.length === 0 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold"
            >
              + Carica le prime immagini
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(img => (
            <div key={img.id}>
              <ImageCard
                image={img}
                onEdit={() => setEditing(img)}
                onDelete={() => remove(img)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// IMAGE CARD
// =====================================================
function ImageCard({ image, onEdit, onDelete }: {
  image: LibraryImage;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const cat = CATEGORIES.find(c => c.value === image.category);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(image.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm group">
      <div className="aspect-square bg-gray-100 relative">
        <img src={image.url} alt={image.altText || image.name} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
          <button onClick={onEdit} className="p-2 bg-white rounded-lg shadow-md" title="Modifica">
            <Edit2 size={14} />
          </button>
          <button onClick={copyUrl} className="p-2 bg-white rounded-lg shadow-md" title="Copia URL">
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
          </button>
          <button onClick={onDelete} className="p-2 bg-white rounded-lg shadow-md text-red-600" title="Elimina">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="p-2">
        <div className="text-[10px] text-gray-500 mb-0.5">{cat?.emoji} {cat?.label || image.category}</div>
        <div className="font-bold text-xs truncate">{image.name}</div>
        {image.tags?.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {image.tags.slice(0, 2).map(t => (
              <span key={t} className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-bold">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// IMAGE EDITOR
// =====================================================
function ImageEditor({ image, onClose }: { image: LibraryImage; onClose: () => void }) {
  const [data, setData] = useState<LibraryImage>(image);
  const [savedMsg, setSavedMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const update = (patch: Partial<LibraryImage>) => setData(prev => ({ ...prev, ...patch }));

  const save = async () => {
    await service.updateLibraryImage(image.id, data);
    setSavedMsg("✓ Salvato");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(data.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 border-2 rounded-xl font-bold">← Indietro</button>
          <h2 className="text-2xl font-black truncate">{data.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && <span className="text-green-600 font-bold text-sm">{savedMsg}</span>}
          <button onClick={save} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold">Salva</button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* IMAGE PREVIEW */}
        <div className="bg-white p-4 rounded-2xl">
          <img src={data.url} alt={data.altText || data.name} className="w-full rounded-xl" />
          <div className="mt-3 text-[11px] text-gray-500">
            {data.width}×{data.height} · {data.format?.toUpperCase()} · {Math.round((data.bytes || 0) / 1024)}KB
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={copyUrl} className="flex-1 px-3 py-2 border-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
              {copied ? <><Check size={12} className="text-green-600" /> Copiato</> : <><Copy size={12} /> Copia URL</>}
            </button>
            <a href={data.url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 border-2 rounded-lg text-xs font-bold">
              Apri originale
            </a>
          </div>
        </div>

        {/* METADATA */}
        <div className="bg-white p-5 rounded-2xl space-y-3">
          <Field label="Nome">
            <input type="text" value={data.name} onChange={e => update({ name: e.target.value })} className="input" />
          </Field>

          <Field label="Categoria">
            <select value={data.category} onChange={e => update({ category: e.target.value as any })} className="input">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
            </select>
          </Field>

          <Field label="Tag (separati da virgola)" hint='Es: "sbiancamento, donna, before-after"'>
            <input
              type="text"
              value={(data.tags || []).join(", ")}
              onChange={e => update({ tags: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
              className="input"
              placeholder="sbiancamento, casi"
            />
          </Field>

          <Field label="Testo alternativo (alt)" hint="Per SEO e accessibilità">
            <input
              type="text"
              value={data.altText || ""}
              onChange={e => update({ altText: e.target.value })}
              className="input"
              placeholder='Es: "Sorriso bianco dopo sbiancamento professionale"'
            />
          </Field>

          <Field label="Descrizione (note interne)">
            <textarea
              value={data.description || ""}
              onChange={e => update({ description: e.target.value })}
              className="input"
              rows={3}
            />
          </Field>

          <div className="bg-gray-50 rounded-xl p-3 text-[11px]">
            <div className="font-bold mb-1">URL Cloudinary:</div>
            <div className="font-mono break-all text-gray-600">{data.url}</div>
          </div>
        </div>
      </div>

      <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; border: 2px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.875rem; } .input:focus { outline: none; border-color: #3b82f6; }`}</style>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1">{label}</label>
      {hint && <p className="text-[10px] text-gray-500 mb-1">{hint}</p>}
      {children}
    </div>
  );
}
