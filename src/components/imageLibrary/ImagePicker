import React, { useEffect, useState, useRef, useMemo } from "react";
import { Upload, X, Search, Image as ImageIcon, Loader, Plus, Check } from "lucide-react";
import * as service from "../../lib/imageLibraryService";
import type { LibraryImage, ImageCategory } from "../../types";

interface Props {
  /** URL attuale dell'immagine (se selezionata) */
  value?: string;
  /** Callback quando l'utente sceglie un'immagine */
  onChange: (url: string, image?: LibraryImage) => void;
  /** Categoria suggerita di default quando si carica nuova */
  defaultCategory?: ImageCategory;
  /** Etichetta per il bottone */
  label?: string;
  /** Mostra in modalità compatta (solo bottone, no preview) */
  compact?: boolean;
}

/**
 * Componente per scegliere immagine: aperto modale → sceglie dall'archivio O carica nuova.
 */
export default function ImagePicker({ value, onChange, defaultCategory = "altro", label = "Scegli immagine", compact = false }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={compact ? "" : "space-y-2"}>
        {!compact && value && (
          <div className="relative inline-block">
            <img src={value} alt="" className="max-w-full max-h-32 rounded-lg border-2 border-gray-200" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
              title="Rimuovi"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-100"
          >
            <ImageIcon size={14} /> {value ? "Cambia" : label}
          </button>
          {value && (
            <input
              type="text"
              value={value}
              onChange={e => onChange(e.target.value)}
              className="flex-1 px-3 py-2 border-2 rounded-lg text-xs font-mono"
              placeholder="https://..."
            />
          )}
        </div>
        {!value && !compact && (
          <input
            type="text"
            value={value || ""}
            onChange={e => onChange(e.target.value)}
            placeholder="Oppure incolla URL: https://..."
            className="w-full px-3 py-2 border-2 rounded-lg text-xs font-mono"
          />
        )}
      </div>

      {open && (
        <ImagePickerModal
          onClose={() => setOpen(false)}
          onSelect={(url, image) => {
            onChange(url, image);
            setOpen(false);
          }}
          defaultCategory={defaultCategory}
        />
      )}
    </>
  );
}

// =====================================================
// MODAL
// =====================================================
const CATEGORIES_FOR_PICKER: { value: ImageCategory; label: string; emoji: string }[] = [
  { value: "hero", label: "Hero", emoji: "🌟" },
  { value: "logo", label: "Logo", emoji: "🏷️" },
  { value: "team", label: "Team", emoji: "👥" },
  { value: "studio", label: "Studio", emoji: "🏢" },
  { value: "prima_dopo", label: "Prima/Dopo", emoji: "✨" },
  { value: "treatments", label: "Trattamenti", emoji: "🦷" },
  { value: "icons", label: "Icone", emoji: "🔣" },
  { value: "social", label: "Social", emoji: "📱" },
  { value: "altro", label: "Altro", emoji: "📦" },
];

function ImagePickerModal({ onClose, onSelect, defaultCategory }: {
  onClose: () => void;
  onSelect: (url: string, image?: LibraryImage) => void;
  defaultCategory: ImageCategory;
}) {
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState<ImageCategory | "">(defaultCategory);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setImages(await service.getLibraryImages());
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return service.filterImages(images, {
      category: filterCategory || undefined,
      searchText: searchText || undefined,
    });
  }, [images, filterCategory, searchText]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    const res = await service.uploadAndSaveToLibrary(file, {
      name: file.name.replace(/\.[^.]+$/, ""),
      category: defaultCategory,
      tags: [],
    });
    setUploading(false);
    if (res.ok && res.image) {
      onSelect(res.image.url, res.image);
    } else {
      setUploadError(res.error || "Errore");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-black">Scegli immagine</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-3 flex gap-2 border-b">
          <button
            onClick={() => setTab("library")}
            className={`px-4 py-2 font-bold text-sm border-b-2 ${tab === "library" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
          >
            📚 Archivio ({images.length})
          </button>
          <button
            onClick={() => setTab("upload")}
            className={`px-4 py-2 font-bold text-sm border-b-2 ${tab === "upload" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
          >
            ⬆️ Carica nuova
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "library" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-[200px] relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    placeholder="Cerca..."
                    className="w-full pl-9 pr-3 py-2 border-2 rounded-xl text-sm"
                  />
                </div>
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value as any)}
                  className="px-3 py-2 border-2 rounded-xl text-sm font-bold"
                >
                  <option value="">Tutte le categorie</option>
                  {CATEGORIES_FOR_PICKER.map(c => (
                    <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>

              {loading ? (
                <p className="text-center py-8">Caricamento...</p>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-2xl">
                  <ImageIcon size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-4">
                    {images.length === 0 ? "Archivio vuoto" : "Nessun risultato"}
                  </p>
                  <button
                    onClick={() => setTab("upload")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm"
                  >
                    + Carica la prima
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filtered.map(img => (
                    <button
                      key={img.id}
                      onClick={() => onSelect(img.url, img)}
                      className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-500"
                    >
                      <img src={img.url} alt={img.altText || img.name} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-blue-600 bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all">
                        <div className="opacity-0 group-hover:opacity-100 bg-white p-2 rounded-full">
                          <Check size={20} className="text-blue-600" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left">
                        <div className="text-white text-[10px] font-bold truncate">{img.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div
                className="border-2 border-dashed border-blue-300 rounded-2xl p-12 text-center bg-blue-50/30 cursor-pointer hover:bg-blue-50"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleUpload(file);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={e => e.target.files && handleUpload(e.target.files[0])}
                  className="hidden"
                />
                {uploading ? (
                  <>
                    <Loader size={48} className="mx-auto text-blue-600 mb-3 animate-spin" />
                    <p className="font-bold">Caricamento...</p>
                  </>
                ) : (
                  <>
                    <Upload size={48} className="mx-auto text-blue-400 mb-3" />
                    <p className="font-bold mb-1">Trascina un'immagine qui</p>
                    <p className="text-xs text-gray-500">o click per selezionare · max 10MB</p>
                  </>
                )}
              </div>

              {uploadError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm">
                  <strong>Errore:</strong> {uploadError}
                </div>
              )}

              <p className="text-xs text-gray-500 text-center">
                L'immagine verrà caricata su Cloudinary e salvata nell'archivio (categoria: {defaultCategory}).
                Puoi modificarla dopo dalla pagina Archivio Immagini.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
