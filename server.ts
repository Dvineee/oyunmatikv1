import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Backend Placeholder
  // Most real-time logic is handled by Supabase directly, but we can put admin tasks here.
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "oyunmatik-backend" });
  });

  // Example Admin API for banning players (if needed via service role)
  app.post("/api/admin/ban", (req, res) => {
    // This would use process.env.SUPABASE_SERVICE_ROLE_KEY
    res.status(501).json({ error: "Banning logic is handled via Supabase RLS/Functions primarily." });
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
