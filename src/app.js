import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.routes.js";
import productosRoutes from "./routes/productos.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(morgan("dev"));

app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/vendor", express.static(path.join(__dirname, "../frontend/vendor")));
app.use("/img",  express.static(path.join(__dirname, "../frontend/img")));
app.use("/imgs", express.static(path.join(__dirname, "../frontend/img")));

app.get("/health", (_req,res)=> res.json({ ok: true }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "Frontend.html"));
});

app.use("/api/auth", authRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/usuarios", usuariosRoutes);

app.use((req,res)=> res.status(404).json({ error: "Ruta no encontrada" }));

app.use((err, _req, res, _next) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: "Validación fallida", details: err.errors });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: "Duplicado", key: err.keyValue });
  }
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
