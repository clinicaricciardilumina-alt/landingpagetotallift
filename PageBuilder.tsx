import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Copy, Eye, EyeOff, ChevronDown, ChevronUp, Save,
  Smartphone, Tablet, Monitor, X, Check
} from "lucide-react";
import * as firebaseService from "../lib/firebaseService";
import CloudinaryUploader from "./CloudinaryUploader";

type BlockType = "section" | "heading" | "paragraph" | "image" | "button" | "form" | "input" | "textarea" | "divider" | "cta" | "video" | "link" | "spacer" | "container" | "html";

interface Block {
  id: string;
  type: BlockType;
  properties: Record<string, any>;
  responsive: {
    desktop: Record<string, any>;
    tablet: Record<string, any>;
    mobile: Record<string, any>;
  };
  children?: Block[];
}

interface Page {
  id: string;
  title: string;
  blocks: Block[];
  createdAt: number;
  updatedAt: number;
}

const BLOCK_CATEGORIES = {
  Layout: [
    { type: "section", label: "Sezione", icon: "▭" },
    { type: "container", label: "Contenitore", icon: "□" },
    { type: "spacer", label: "Spazio", icon: "↕" }
  ],
  Text: [
    { type: "heading", label: "Titolo", icon: "H" },
    { type: "paragraph", label: "Paragrafo", icon: "¶" }
  ],
  Media: [
    { type: "image", label: "Immagine", icon: "🖼" },
    { type: "video", label: "Video", icon: "▶" }
  ],
  Form: [
    { type: "form", label: "Form", icon: "📋" },
    { type: "input", label: "Input", icon: "📝" },
    { type: "textarea", label: "Area Testo", icon: "📄" },
    { type: "button", label: "Pulsante", icon: "⊙" }
  ],
  CTA: [
    { type: "cta", label: "Call-to-Action", icon: "→" },
    { type: "link", label: "Link", icon: "🔗" }
  ],
  Utility: [
    { type: "divider", label: "Divisore", icon: "─" },
    { type: "html", label: "HTML Custom", icon: "</>" }
  ]
};

const BLOCK_DEFAULTS: Record<BlockType, any> = {
  section: {
    backgroundColor: "#ffffff",
    padding: "60px 20px",
    minHeight: "400px"
  },
  heading: {
    text: "Titolo della Sezione",
    fontSize: "48px",
    fontWeight: "900",
    color: "#0066A1",
    textAlign: "center",
    marginBottom: "20px"
  },
  paragraph: {
    text: "Testo paragrafo di default. Clicca per modificare.",
    fontSize: "16px",
    color: "#333333",
    lineHeight: "1.6",
    marginBottom: "20px"
  },
  image: {
    src: "",
    alt: "Immagine",
    width: "100%",
    height: "auto",
    objectFit: "cover",
    borderRadius: "12px"
  },
  video: {
    src: "",
    width: "100%",
    height: "600px",
    borderRadius: "12px"
  },
  button: {
    text: "Clicca qui",
    backgroundColor: "#0066A1",
    color: "#ffffff",
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "bold",
    borderRadius: "8px",
    cursor: "pointer"
  },
  form: {
    backgroundColor: "#f5f5f5",
    padding: "40px",
    borderRadius: "12px"
  },
  input: {
    placeholder: "Scrivi qui...",
    width: "100%",
    padding: "12px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    marginBottom: "12px"
  },
  textarea: {
    placeholder: "Scrivi messaggio...",
    width: "100%",
    padding: "12px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    minHeight: "120px",
    marginBottom: "12px"
  },
  divider: {
    borderTop: "1px solid #ddd",
    margin: "30px 0"
  },
  cta: {
    text: "Scopri di più",
    backgroundColor: "#0066A1",
    color: "#ffffff",
    padding: "16px 40px",
    fontSize: "18px",
    fontWeight: "bold",
    borderRadius: "8px",
    textAlign: "center"
  },
  link: {
    text: "Link",
    color: "#0066A1",
    fontSize: "16px",
    textDecoration: "underline"
  },
  spacer: {
    height: "40px"
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px"
  },
  html: {
    html: "<div>Custom HTML qui</div>"
  }
};

export default function PageBuilder() {
  const [page, setPage] = useState<Page>({
    id: "page-" + Date.now(),
    title: "La mia Landing Page",
    blocks: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    Layout: true,
    Text: true,
    Media: false,
    Form: false,
    CTA: false,
    Utility: false
  });

  const selectedBlock = selectedBlockId ? findBlockById(page.blocks, selectedBlockId) : null;

  function findBlockById(blocks: Block[], id: string): Block | null {
    for (const block of blocks) {
      if (block.id === id) return block;
      if (block.children) {
        const found = findBlockById(block.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  function updateBlockInTree(blocks: Block[], blockId: string, updates: Partial<Block>): Block[] {
    return blocks.map(block => {
      if (block.id === blockId) {
        return { ...block, ...updates };
      }
      if (block.children) {
        return {
          ...block,
          children: updateBlockInTree(block.children, blockId, updates)
        };
      }
      return block;
    });
  }

  function deleteBlockFromTree(blocks: Block[], blockId: string): Block[] {
    return blocks.filter(block => {
      if (block.id === blockId) return false;
      if (block.children) {
        block.children = deleteBlockFromTree(block.children, blockId);
      }
      return true;
    });
  }

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: "block-" + Date.now(),
      type,
      properties: BLOCK_DEFAULTS[type],
      responsive: {
        desktop: {},
        tablet: {},
        mobile: {}
      },
      children: type === "section" || type === "container" ? [] : undefined
    };

    setPage({
      ...page,
      blocks: [...page.blocks, newBlock],
      updatedAt: Date.now()
    });
    setSelectedBlockId(newBlock.id);
  };

  const deleteBlock = (id: string) => {
    setPage({
      ...page,
      blocks: deleteBlockFromTree(page.blocks, id),
      updatedAt: Date.now()
    });
    setSelectedBlockId(null);
  };

  const duplicateBlock = (id: string) => {
    const block = findBlockById(page.blocks, id);
    if (!block) return;

    const newBlock: Block = {
      ...block,
      id: "block-" + Date.now()
    };

    setPage({
      ...page,
      blocks: [...page.blocks, newBlock],
      updatedAt: Date.now()
    });
  };

  const updateProperty = (key: string, value: any) => {
    if (!selectedBlockId) return;

    setPage({
      ...page,
      blocks: updateBlockInTree(page.blocks, selectedBlockId, {
        properties: {
          ...selectedBlock?.properties,
          [key]: value
        }
      }),
      updatedAt: Date.now()
    });
  };

  const saveToFirebase = async () => {
    setIsSaving(true);
    try {
      const pageData = {
        blocks: page.blocks,
        title: page.title,
        updatedAt: Date.now()
      };
      await firebaseService.savePageBuilder(pageData);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const getViewportClass = () => {
    switch (viewport) {
      case "mobile":
        return "max-w-sm mx-auto";
      case "tablet":
        return "max-w-2xl mx-auto";
      default:
        return "max-w-7xl mx-auto";
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR SINISTRO - Aggiungi Blocchi */}
      <aside className="w-72 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="font-black text-lg text-gray-900 mb-2">Aggiungi Blocchi</h3>
          <p className="text-xs text-gray-500">Trascina o clicca per aggiungere</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {Object.entries(BLOCK_CATEGORIES).map(([category, blocks]) => (
            <div key={category}>
              <button
                onClick={() => setExpandedCategories(prev => ({
                  ...prev,
                  [category]: !prev[category]
                }))}
                className="w-full flex items-center justify-between p-3 text-left font-bold text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              >
                <span className="text-sm">{category}</span>
                {expandedCategories[category] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              <AnimatePresence>
                {expandedCategories[category] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 ml-2 mt-1 overflow-hidden"
                  >
                    {blocks.map((block) => (
                      <button
                        key={block.type}
                        onClick={() => addBlock(block.type as BlockType)}
                        className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-[#0066A1]/5 to-[#004d7a]/5 hover:from-[#0066A1]/15 hover:to-[#004d7a]/15 border border-[#0066A1]/20 rounded-lg transition-all hover:border-[#0066A1]/40 group"
                      >
                        <span className="text-lg group-hover:scale-110 transition-transform">{block.icon}</span>
                        <div className="text-left flex-1">
                          <div className="text-sm font-bold text-gray-800">{block.label}</div>
                          <div className="text-xs text-gray-500">{block.type}</div>
                        </div>
                        <Plus size={16} className="text-[#0066A1]" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 space-y-3 sticky bottom-0 bg-white">
          <button
            onClick={saveToFirebase}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 bg-[#0066A1] text-white py-3 rounded-lg font-bold hover:bg-[#004d7a] transition-all disabled:opacity-50"
          >
            <Save size={18} />
            {isSaving ? "Salvataggio..." : "Salva Pagina"}
          </button>

          {saveStatus === "success" && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm font-bold">
              <Check size={16} /> Salvato!
            </div>
          )}
          {saveStatus === "error" && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-bold">
              <X size={16} /> Errore!
            </div>
          )}
        </div>
      </aside>

      {/* CANVAS PRINCIPALE - Editor WYSIWYG */}
      <main className="flex-1 flex flex-col bg-white">
        {/* Top Bar */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-8 bg-white sticky top-0 z-20 shadow-sm">
          <div className="flex-1">
            <input
              type="text"
              value={page.title}
              onChange={(e) => setPage({ ...page, title: e.target.value })}
              className="text-2xl font-black text-gray-900 bg-transparent border-none outline-none"
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
            <button
              onClick={() => setViewport("desktop")}
              className={`p-2 rounded transition-all ${viewport === "desktop" ? "bg-[#0066A1] text-white" : "text-gray-600 hover:text-gray-900"}`}
              title="Desktop"
            >
              <Monitor size={20} />
            </button>
            <button
              onClick={() => setViewport("tablet")}
              className={`p-2 rounded transition-all ${viewport === "tablet" ? "bg-[#0066A1] text-white" : "text-gray-600 hover:text-gray-900"}`}
              title="Tablet"
            >
              <Tablet size={20} />
            </button>
            <button
              onClick={() => setViewport("mobile")}
              className={`p-2 rounded transition-all ${viewport === "mobile" ? "bg-[#0066A1] text-white" : "text-gray-600 hover:text-gray-900"}`}
              title="Mobile"
            >
              <Smartphone size={20} />
            </button>
          </div>
        </div>

        {/* Editor Canvas */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 p-8">
          <div className={`bg-white rounded-xl shadow-lg transition-all ${getViewportClass()}`}>
            {page.blocks.length === 0 ? (
              <div className="h-96 flex items-center justify-center text-center">
                <div>
                  <div className="text-4xl mb-4">📄</div>
                  <p className="text-gray-500 font-bold text-lg">Pagina vuota</p>
                  <p className="text-gray-400 text-sm">Aggiungi blocchi dalla sinistra</p>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {page.blocks.map((block) => (
                  <BlockRenderer
                    key={block.id}
                    block={block}
                    isSelected={selectedBlockId === block.id}
                    onSelect={() => setSelectedBlockId(block.id)}
                    onDelete={() => deleteBlock(block.id)}
                    onDuplicate={() => duplicateBlock(block.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* INSPECTOR DESTRO - Proprietà Blocco */}
      <aside className="w-80 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
        {selectedBlock ? (
          <>
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-lg text-gray-900">Proprietà</h3>
                <button
                  onClick={() => deleteBlock(selectedBlockId!)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Elimina blocco"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="text-sm text-gray-500 font-bold uppercase tracking-wider">
                {selectedBlock.type}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {renderInspectorFields(selectedBlock, updateProperty)}
            </div>

            <div className="p-6 border-t border-gray-200 space-y-3 sticky bottom-0 bg-white">
              <button
                onClick={() => duplicateBlock(selectedBlockId!)}
                className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-all"
              >
                <Copy size={16} /> Duplica
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-6">
            <div>
              <div className="text-4xl mb-4">👆</div>
              <p className="text-gray-500 font-bold">Seleziona un blocco</p>
              <p className="text-gray-400 text-sm">per modificarne le proprietà</p>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function BlockRenderer({
  block,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate
}: {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`relative p-4 transition-all cursor-pointer ${
        isSelected
          ? "bg-[#E8F4F8] border-2 border-[#0066A1]"
          : "border-2 border-transparent hover:border-gray-200 hover:bg-gray-50"
      }`}
    >
      {/* Rendering del blocco */}
      <div className="pointer-events-none">
        {block.type === "heading" && (
          <h2 style={{ fontSize: block.properties.fontSize, color: block.properties.color }}>
            {block.properties.text}
          </h2>
        )}
        {block.type === "paragraph" && (
          <p style={{ fontSize: block.properties.fontSize, color: block.properties.color }}>
            {block.properties.text}
          </p>
        )}
        {block.type === "button" && (
          <button style={{ backgroundColor: block.properties.backgroundColor, color: block.properties.color, padding: block.properties.padding }}>
            {block.properties.text}
          </button>
        )}
        {block.type === "image" && block.properties.src && (
          <img
            src={block.properties.src}
            alt={block.properties.alt}
            style={{ width: block.properties.width, borderRadius: block.properties.borderRadius, maxHeight: "300px", objectFit: "cover" }}
          />
        )}
        {block.type === "image" && !block.properties.src && (
          <div className="bg-gray-100 h-64 rounded flex items-center justify-center">
            <span className="text-gray-400">📸 Nessuna immagine</span>
          </div>
        )}
        {block.type === "divider" && <div style={block.properties} />}
        {block.type === "spacer" && <div style={{ height: block.properties.height }} />}
        {block.type === "input" && (
          <input
            type="text"
            placeholder={block.properties.placeholder}
            style={{ width: "100%", padding: block.properties.padding }}
            disabled
          />
        )}
        {block.type === "textarea" && (
          <textarea
            placeholder={block.properties.placeholder}
            style={{ width: "100%", padding: block.properties.padding, minHeight: block.properties.minHeight }}
            disabled
          />
        )}
        {!["heading", "paragraph", "button", "image", "divider", "spacer", "input", "textarea"].includes(block.type) && (
          <div className="p-4 bg-gray-100 rounded text-center text-gray-600 font-bold">
            {block.type}
          </div>
        )}
      </div>

      {/* Toolbar */}
      {isSelected && (
        <div className="absolute top-2 right-2 flex gap-1 bg-white p-2 rounded-lg shadow-lg border border-gray-200 opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1.5 hover:bg-gray-100 rounded transition-all"
            title="Duplica"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-all"
            title="Elimina"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function renderInspectorFields(block: Block, onUpdate: (key: string, value: any) => void) {
  const commonFields = [];

  // CLOUDINARY UPLOADER per le immagini
  if (block.type === "image") {
    commonFields.push(
      <div key="cloudinary">
        <label className="block text-xs font-bold text-gray-600 mb-3">📤 Carica Immagine (Cloudinary)</label>
        <CloudinaryUploader
          currentUrl={block.properties.src}
          onImageUrlChange={(url) => onUpdate("src", url)}
        />
      </div>
    );
  }

  // Campi comuni per la maggior parte dei blocchi
  if (["heading", "paragraph", "button", "cta", "link"].includes(block.type)) {
    commonFields.push(
      <div key="text">
        <label className="block text-xs font-bold text-gray-600 mb-2">Testo</label>
        <textarea
          value={block.properties.text || ""}
          onChange={(e) => onUpdate("text", e.target.value)}
          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#0066A1]"
          rows={3}
        />
      </div>
    );
  }

  // Colore per testo
  if (["heading", "paragraph", "button", "cta", "link"].includes(block.type)) {
    commonFields.push(
      <div key="color">
        <label className="block text-xs font-bold text-gray-600 mb-2">Colore Testo</label>
        <input
          type="color"
          value={block.properties.color || "#000000"}
          onChange={(e) => onUpdate("color", e.target.value)}
          className="w-full h-10 border border-gray-300 rounded cursor-pointer"
        />
      </div>
    );
  }

  // Font size
  if (["heading", "paragraph"].includes(block.type)) {
    commonFields.push(
      <div key="fontSize">
        <label className="block text-xs font-bold text-gray-600 mb-2">Dimensione Testo</label>
        <input
          type="text"
          value={block.properties.fontSize || "16px"}
          onChange={(e) => onUpdate("fontSize", e.target.value)}
          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#0066A1]"
          placeholder="es: 24px"
        />
      </div>
    );
  }

  // Background color per sezioni
  if (["section", "container"].includes(block.type)) {
    commonFields.push(
      <div key="bgColor">
        <label className="block text-xs font-bold text-gray-600 mb-2">Colore Sfondo</label>
        <input
          type="color"
          value={block.properties.backgroundColor || "#ffffff"}
          onChange={(e) => onUpdate("backgroundColor", e.target.value)}
          className="w-full h-10 border border-gray-300 rounded cursor-pointer"
        />
      </div>
    );
  }

  // Padding
  if (["section", "container", "button"].includes(block.type)) {
    commonFields.push(
      <div key="padding">
        <label className="block text-xs font-bold text-gray-600 mb-2">Padding (spazio interno)</label>
        <input
          type="text"
          value={block.properties.padding || "20px"}
          onChange={(e) => onUpdate("padding", e.target.value)}
          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#0066A1]"
          placeholder="es: 20px, 20px 40px"
        />
      </div>
    );
  }

  // Alt text per immagini
  if (block.type === "image") {
    commonFields.push(
      <div key="alt">
        <label className="block text-xs font-bold text-gray-600 mb-2">Alt Text</label>
        <input
          type="text"
          value={block.properties.alt || ""}
          onChange={(e) => onUpdate("alt", e.target.value)}
          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#0066A1]"
          placeholder="Descrizione per accessibilità"
        />
      </div>
    );
  }

  // Border radius per immagini
  if (block.type === "image") {
    commonFields.push(
      <div key="borderRadius">
        <label className="block text-xs font-bold text-gray-600 mb-2">Border Radius</label>
        <input
          type="text"
          value={block.properties.borderRadius || "12px"}
          onChange={(e) => onUpdate("borderRadius", e.target.value)}
          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#0066A1]"
          placeholder="es: 12px"
        />
      </div>
    );
  }

  // Placeholder per input/textarea
  if (["input", "textarea"].includes(block.type)) {
    commonFields.push(
      <div key="placeholder">
        <label className="block text-xs font-bold text-gray-600 mb-2">Placeholder</label>
        <input
          type="text"
          value={block.properties.placeholder || ""}
          onChange={(e) => onUpdate("placeholder", e.target.value)}
          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#0066A1]"
        />
      </div>
    );
  }

  // HTML custom
  if (block.type === "html") {
    commonFields.push(
      <div key="html">
        <label className="block text-xs font-bold text-gray-600 mb-2">HTML</label>
        <textarea
          value={block.properties.html || ""}
          onChange={(e) => onUpdate("html", e.target.value)}
          className="w-full p-2 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-[#0066A1]"
          rows={6}
        />
      </div>
    );
  }

  return commonFields;
}
