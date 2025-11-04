// src/routes/usuarios.routes.js
import { Router } from "express";
import { body, validationResult } from "express-validator";
import Usuario from "../models/Usuario.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";

const r = Router();

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
};

// === LISTADOS (PRIMERO las rutas específicas) ===

// (Admin) listar inactivos (ES)
r.get("/inactivos", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const list = await Usuario.find({ isActive: false }, { password: 0 })
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (e) { next(e); }
});

// (Admin) alias en inglés para compatibilidad con el front actual
r.get("/inactive", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const list = await Usuario.find({ isActive: false }, { password: 0 })
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (e) { next(e); }
});

// (Admin) listar activos (o usa ?all=true para TODOS)
r.get("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (String(req.query.all).toLowerCase() === "true") {
      const list = await Usuario.find({}, { password: 0 })
        .sort({ createdAt: -1 })
        .lean();
      return res.json(list);
    }
    const list = await Usuario
      .find(
        { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
        { password: 0 }
      )
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (e) { next(e); }
});

// === CRUD (AL FINAL el /:id para no tapar /inactive) ===

// (Admin) obtener uno
r.get("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const u = await Usuario.findById(req.params.id, { password: 0 }).lean();
    if (!u) return res.status(404).json({ error: "No encontrado" });
    res.json(u);
  } catch (e) { next(e); }
});

// (Admin) crear
r.post(
  "/",
  requireAuth, requireAdmin,
  body("name").trim().notEmpty().withMessage("name requerido"),
  body("email").isEmail().withMessage("email inválido"),
  body("password").isLength({ min: 6 }).withMessage("password >= 6"),
  body("role").isIn(["user","admin"]).withMessage("role inválido"),
  body("isActive").optional().isBoolean(),
  async (req, res, next) => {
    try {
      if (validate(req, res)) return;
      const exists = await Usuario.findOne({ email: req.body.email });
      if (exists) return res.status(409).json({ error: "Email ya registrado" });

      const created = await Usuario.create(req.body);
      const { password, ...clean } = created.toObject();
      res.status(201).json(clean);
    } catch (e) { next(e); }
  }
);

// (Admin) actualizar (si password vacío, no se cambia)
r.put("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const update = { ...req.body };
    if (!update.password) delete update.password;

    const upd = await Usuario.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true, projection: { password: 0 } }
    );
    if (!upd) return res.status(404).json({ error: "No encontrado" });
    res.json(upd);
  } catch (e) { next(e); }
});

// (Admin) toggle activo/inactivo
r.patch("/:id/toggle", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const u = await Usuario.findById(req.params.id);
    if (!u) return res.status(404).json({ error: "No encontrado" });
    u.isActive = !Boolean(u.isActive);
    await u.save();
    const { password, ...clean } = u.toObject();
    res.json(clean);
  } catch (e) { next(e); }
});

// (Admin) eliminar
r.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const del = await Usuario.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ error: "No encontrado" });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default r;
