import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Data storage path
  const DATA_PATH = path.join(process.cwd(), "data");
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(DATA_PATH);
  }
  const SETTINGS_FILE = path.join(DATA_PATH, "settings.json");
  const QUESTIONS_FILE = path.join(DATA_PATH, "questions.json");
  const SLOTS_FILE = path.join(DATA_PATH, "slots.json");
  const BOOKINGS_FILE = path.join(DATA_PATH, "bookings.json");

  // Initial data if not exists
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({
      hero_title: "TOTAL LIFT",
      hero_subtitle: "Total Beauty Day",
      hero_date: "Mercoledì 19 Novembre",
      hero_description: "Scopri le nostre soluzioni per il ringiovanimento del volto senza bisturi. Soluzioni a uno step senza alterazioni e risultati naturali con il miglioramento dei volumi di mezzo viso.",
      cta_text: "Scopri le nostre soluzioni",
      hero_image: "/images/hero.jpg",
      selected_images: ["hero.jpg"]
    }, null, 2));
  }

  if (!fs.existsSync(QUESTIONS_FILE)) {
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify([
      {
        id: 1,
        text: "Qual è il tuo obiettivo principale?",
        type: "single",
        options: ["Ringiovanimento viso completo", "Ridurre rughe di espressione", "Rilassamento specifico", "Solo curiosità"]
      },
      {
        id: 2,
        text: "Questa è la tua prima volta con trattamenti di questo tipo?",
        type: "single",
        options: ["Sì, è la mia prima volta", "Ho già fatto altri trattamenti", "Ho fatto interventi invasivi"]
      }
    ], null, 2));
  }

  if (!fs.existsSync(SLOTS_FILE)) {
    fs.writeFileSync(SLOTS_FILE, JSON.stringify([], null, 2));
  }

  if (!fs.existsSync(BOOKINGS_FILE)) {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([], null, 2));
  }

  // API Routes
  app.get("/api/settings", (req, res) => {
    const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
    res.json(settings);
  });

  app.post("/api/settings", (req, res) => {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  });

  app.get("/api/questions", (req, res) => {
    const data = JSON.parse(fs.readFileSync(QUESTIONS_FILE, "utf-8"));
    res.json(data);
  });

  app.post("/api/questions", (req, res) => {
    const data = JSON.parse(fs.readFileSync(QUESTIONS_FILE, "utf-8"));
    const newQ = { ...req.body, id: Date.now() };
    data.push(newQ);
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(data, null, 2));
    res.json(newQ);
  });

  app.put("/api/questions/:id", (req, res) => {
    let data = JSON.parse(fs.readFileSync(QUESTIONS_FILE, "utf-8"));
    data = data.map((q: any) => q.id === parseInt(req.params.id) ? { ...req.body, id: q.id } : q);
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  });

  app.delete("/api/questions/:id", (req, res) => {
    let data = JSON.parse(fs.readFileSync(QUESTIONS_FILE, "utf-8"));
    data = data.filter((q: any) => q.id !== parseInt(req.params.id));
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  });

  app.get("/api/slots", (req, res) => {
    const data = JSON.parse(fs.readFileSync(SLOTS_FILE, "utf-8"));
    res.json(data);
  });

  app.post("/api/slots", (req, res) => {
    const data = JSON.parse(fs.readFileSync(SLOTS_FILE, "utf-8"));
    const newSlot = { ...req.body, booked: 0 };
    data.push(newSlot);
    fs.writeFileSync(SLOTS_FILE, JSON.stringify(data, null, 2));
    res.json(newSlot);
  });

  app.delete("/api/slots/:date/:time", (req, res) => {
    let data = JSON.parse(fs.readFileSync(SLOTS_FILE, "utf-8"));
    data = data.filter((s: any) => s.date !== req.params.date || s.time !== req.params.time);
    fs.writeFileSync(SLOTS_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  });

  app.get("/api/bookings", (req, res) => {
    const data = JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf-8"));
    res.json(data);
  });

  app.post("/api/bookings", (req, res) => {
    const data = JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf-8"));
    const newBooking = { ...req.body, id: Date.now(), created_at: new Date().toISOString() };
    data.push(newBooking);
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(data, null, 2));
    
    // Update slot booked count
    let slots = JSON.parse(fs.readFileSync(SLOTS_FILE, "utf-8"));
    slots = slots.map((s: any) => {
      if (s.date === newBooking.date && s.time === newBooking.time) {
        return { ...s, booked: (s.booked || 0) + 1 };
      }
      return s;
    });
    fs.writeFileSync(SLOTS_FILE, JSON.stringify(slots, null, 2));

    res.json(newBooking);
  });

  app.get("/api/stats", (req, res) => {
    const bookings = JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf-8"));
    const total_bookings = bookings.length;
    const paid_bookings = bookings.filter((b: any) => b.payment_status === "paid").length;
    res.json({ total_bookings, paid_bookings });
  });

  app.get("/api/images", (req, res) => {
    const imagesDir = path.join(process.cwd(), "public", "images");
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    try {
      const files = fs.readdirSync(imagesDir);
      const images = files.filter(file => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file));
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Failed to list images" });
    }
  });

  // Questions API (as mentioned in the user's HTML)
  app.get("/api/questions", (req, res) => {
    res.json([
      {
        id: 1,
        text: "Qual è il tuo obiettivo principale?",
        type: "single",
        options: [
          "Ringiovanimento viso completo",
          "Ridurre rughe di espressione",
          "Rilassamento specifico (collo, occhi, fronte)",
          "Solo curiosità, voglio capire come funziona"
        ]
      },
      {
        id: 2,
        text: "Questa è la tua prima volta con trattamenti di questo tipo?",
        type: "single",
        options: [
          "Sì, è la mia prima volta",
          "Ho già fatto altri trattamenti prima",
          "Ho fatto interventi più invasivi",
          "Preferisco non dire"
        ]
      },
      {
        id: 3,
        text: "Quando vorresti fare il trattamento?",
        type: "single",
        options: [
          "Subito, il prima possibile",
          "Tra 1-2 mesi",
          "Tra 3-6 mesi",
          "Solo curiosità per ora"
        ]
      }
    ]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
