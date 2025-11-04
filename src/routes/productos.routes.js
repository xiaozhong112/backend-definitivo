// src/routes/productos.routes.js
import { Router } from "express";
import { body, validationResult } from "express-validator";
import Producto from "../models/Producto.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";

const r = Router();

/**
 * GET /api/productos
 * Público: lista SOLO activos (catálogo)
 * Ordenados por fecha de creación desc
 */
r.get("/", async (_req, res, next) => {
  try {
    const q = await Producto.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();
    res.json(q);
  } catch (e) { next(e); }
});

/**
 * GET /api/productos/all
 * Admin: lista TODOS (activos + inactivos)
 */
r.get("/all", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const all = await Producto.find({})
      .sort({ createdAt: -1 })
      .lean();
    res.json(all);
  } catch (e) { next(e); }
});

/**
 * GET /api/productos/inactive
 * Admin: lista SOLO inactivos
 */
r.get("/inactive", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const list = await Producto.find({ isActive: false })
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (e) { next(e); }
});

/**
 * POST /api/productos
 * Admin: crear producto
 */
r.post(
  "/",
  requireAuth,
  requireAdmin,
  body("name").trim().notEmpty().withMessage("name requerido"),
  body("variants").isArray({ min: 1 }).withMessage("al menos 1 variante"),
  body("variants.*.volumeMl").isNumeric().withMessage("volumeMl numérico"),
  body("variants.*.price").isFloat({ min: 0 }).withMessage("price >= 0"),
  body("variants.*.stock").optional().isInt({ min: 0 }).withMessage("stock >= 0"),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const created = await Producto.create(req.body);
      res.status(201).json(created);
    } catch (e) { next(e); }
  }
);

/**
 * PUT /api/productos/:id
 * Admin: actualizar producto
 * Nota: si cambia "name", el pre('findOneAndUpdate') actualizará el slug.
 */
r.put("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const upd = await Producto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!upd) return res.status(404).json({ error: "No encontrado" });
    res.json(upd);
  } catch (e) { next(e); }
});

/**
 * PATCH /api/productos/:id/toggle
 * Admin: alternar activo/inactivo
 */
r.patch("/:id/toggle", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const p = await Producto.findById(req.params.id);
    if (!p) return res.status(404).json({ error: "No encontrado" });

    p.isActive = !p.isActive;
    await p.save();
    res.json({ ok: true, isActive: p.isActive });
  } catch (e) { next(e); }
});

/**
 * DELETE /api/productos/:id
 * Admin: eliminar definitivamente
 */
r.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const del = await Producto.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ error: "No encontrado" });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

r.get("/:idOrSlug", async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;

    const byId = /^[0-9a-fA-F]{24}$/.test(idOrSlug)
      ? await Producto.findOne({ _id: idOrSlug, isActive: true })
      : null;

    const prod = byId || await Producto.findOne({ slug: idOrSlug, isActive: true });

    if (!prod) return res.status(404).json({ error: "No encontrado" });
    res.json(prod);
  } catch (e) { next(e); }
});

export default r;
