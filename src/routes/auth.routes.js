import { Router } from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";
import { requireAuth } from "../middlewares/auth.js";

const r = Router();

function ensureJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET no configurado");
  }
}

function sign(payload, opts = { expiresIn: "7d" }) {
  ensureJwtSecret();
  return jwt.sign(payload, process.env.JWT_SECRET, opts);
}

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
}

r.post(
  "/register",
  body("name").trim().notEmpty(),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  async (req, res, next) => {
    try {
      if (validate(req, res)) return;

      const name = String(req.body.name || "").trim();
      const email = String(req.body.email || "").toLowerCase();
      const password = String(req.body.password || "");

      const exists = await Usuario.findOne({ email });
      if (exists) return res.status(409).json({ error: "Email ya registrado" });

      const user = await Usuario.create({ name, email, password });

      if (process.env.ADMIN_EMAIL && user.email === String(process.env.ADMIN_EMAIL).toLowerCase()) {
        user.role = "admin";
        await user.save();
      }

      const token = sign({ id: user._id, role: user.role, name: user.name });
      res.status(201).json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    } catch (e) {
      next(e);
    }
  }
);

r.post(
  "/login",
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
  async (req, res, next) => {
    try {
      if (validate(req, res)) return;

      const email = String(req.body.email || "").toLowerCase();
      const password = String(req.body.password || "");

      const user = await Usuario.findOne({ email });
      if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

      const ok = await user.comparePassword(password);
      if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

      if (user.isActive === false) return res.status(403).json({ error: "Usuario inactivo" });

      const token = sign({ id: user._id, role: user.role, name: user.name });
      res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (e) {
      next(e);
    }
  }
);

r.get("/me", requireAuth, async (req, res, next) => {
  try {
    const u = await Usuario.findById(req.user.id, { password: 0 }).lean();
    if (!u) return res.status(404).json({ error: "No encontrado" });
    res.json({ id: u._id, name: u.name, email: u.email, role: u.role, isActive: u.isActive });
  } catch (e) {
    next(e);
  }
});

export default r;
