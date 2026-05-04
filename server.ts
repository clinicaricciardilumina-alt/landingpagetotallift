import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ MEMORIA IN RAM - Non usa il filesystem
let settings = {
  hero_title: "TOTAL LIFT",
  hero_subtitle: "Total Beauty Day",
  hero_date: "Mercoledì 19 Novembre",
  hero_description: "Scopri le nostre soluzioni per il ringiovanimento del volto senza bisturi. Soluzioni a uno step senza alterazioni e risultati naturali con il miglioramento dei volumi di mezzo viso.",
  cta_text: "Scopri le nostre soluzioni",
  hero_image: "/images/hero.jpg",
  selected_images: ["hero.jpg"],
  image_urls: {}
};

let questions = [
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
];

let slots: any[] = [];
let bookings: any[] = [];

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API ROUTES - Usa memoria in RAM

  // Settings
  app.get("/api/settings", (req, res) => {
    res.json(settings);
  });

  app.post("/api/settings", (req, res) => {
    settings = req.body;
    res.json({ success: true });
  });

  // Questions
  app.get("/api/questions", (req, res) => {
    res.json(questions);
  });

  app.post("/api/questions", (req, res) => {
    const newQ = { ...req.body, id: Date.now() };
    questions.push(newQ);
    res.json(newQ);
  });

  app.put("/api/questions/:id", (req, res) => {
    const id = parseInt(req.params.id);
    questions = questions.map((q: any) => q.id === id ? { ...req.body, id: q.id } : q);
    res.json({ success: true });
  });

  app.delete("/api/questions/:id", (req, res) => {
    const id = parseInt(req.params.id);
    questions = questions.filter((q: any) => q.id !== id);
    res.json({ success: true });
  });

  // Slots
  app.get("/api/slots", (req, res) => {
    res.json(slots);
  });

  app.post("/api/slots", (req, res) => {
    const newSlot = { ...req.body, booked: 0 };
    slots.push(newSlot);
    res.json(newSlot);
  });

  app.delete("/api/slots/:date/:time", (req, res) => {
    const { date, time } = req.params;
    slots = slots.filter((s: any) => !(s.date === date && s.time === time));
    res.json({ success: true });
  });

  // Bookings
  app.get("/api/bookings", (req, res) => {
    res.json(bookings);
  });

  app.post("/api/bookings", (req, res) => {
    const newBooking = { ...req.body, id: Date.now(), created_at: new Date().toISOString() };
    bookings.push(newBooking);

    // Update slot booked count
    slots = slots.map((s: any) => {
      if (s.date === newBooking.date && s.time === newBooking.time) {
        return { ...s, booked: (s.booked || 0) + 1 };
      }
      return s;
    });

    res.json(newBooking);
  });

  // Stats
  app.get("/api/stats", (req, res) => {
    const total_bookings = bookings.length;
    const paid_bookings = bookings.filter((b: any) => b.payment_status === "paid").length;
    res.json({ total_bookings, paid_bookings });
  });

  // Images
  app.get("/api/images", (req, res) => {
    res.json(["hero.jpg", "before-after-1.jpg", "before-after-2.jpg", "before-after-3.jpg", "studio.jpg", "procedure.jpg"]);
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
