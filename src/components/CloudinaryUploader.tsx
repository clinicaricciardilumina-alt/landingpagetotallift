import React, { useState, useRef } from "react";
import { Upload, X, Check, AlertCircle, Loader } from "lucide-react";

interface CloudinaryUploaderProps {
  onImageUrlChange: (url: string) => void;
  currentUrl?: string;
}

const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || "demo";
const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || "unsigned_preset";

export default function CloudinaryUploader({ onImageUrlChange, currentUrl }: CloudinaryUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToCloudinary = async (file: File) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!file.type.startsWith("image/")) {
        throw new Error("Per favore seleziona un'immagine valida");
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error("L'immagine è troppo grande (max 10MB)");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error("Errore upload Cloudinary");
      }

      const data = await response.json();
      const imageUrl = data.secure_url;

      setPreview(imageUrl);
      onImageUrlChange(imageUrl);

      navigator.clipboard.writeText(imageUrl);
      setSuccess(true);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore durante l'upload";
      setError(message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadToCloudinary(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadToCloudinary(file);
    }
  };

  const handleDragActive = (e: React.DragEvent<HTMLDivElement>, active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(active);
  };

  const handleClear = () => {
    setPreview(null);
    onImageUrlChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragEnter={(e) => handleDragActive(e, true)}
        onDragLeave={(e) => handleDragActive(e, false)}
        onDragOver={(e) => handleDragActive(e, true)}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? "border-[#0066A1] bg-[#E8F4F8]"
            : "border-gray-300 bg-gray-50 hover:border-[#0066A1] hover:bg-[#f0f8fc]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={loading}
        />

        <div className="flex flex-col items-center gap-3">
          {loading ? (
            <>
              <Loader size={32} className="text-[#0066A1] animate-spin" />
              <p className="font-bold text-gray-700">Upload in corso...</p>
            </>
          ) : (
            <>
              <Upload size={32} className="text-[#0066A1]" />
              <div>
                <p className="font-bold text-gray-900">Trascina qui l'immagine</p>
                <p className="text-sm text-gray-500">o clicca per selezionare</p>
              </div>
              <p className="text-xs text-gray-400">Max 10MB • JPG, PNG, WebP</p>
            </>
          )}
        </div>
      </div>

      {preview && (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-gray-100 h-48">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">URL Immagine</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={preview}
                readOnly
                className="flex-1 p-2 border border-gray-300 rounded-lg text-xs font-mono bg-gray-50"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(preview);
                  setSuccess(true);
                  setTimeout(() => setSuccess(false), 2000);
                }}
                className="px-3 py-2 bg-[#0066A1] text-white rounded-lg font-bold text-xs hover:bg-[#004d7a] transition-all"
              >
                Copia
              </button>
            </div>
          </div>

          <button
            onClick={handleClear}
            className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-all text-sm"
          >
            <X size={16} /> Cancella
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm font-bold">
          <Check size={16} /> Link copiato negli appunti!
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-bold">
          <AlertCircle size={16} /> {error}
        </div>
      )}
    </div>
  );
}
