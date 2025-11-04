// src/middlewares/auth.js
import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || req.headers.Authorization || "";
    const parts = hdr.split(" ");
    const token = (parts[0]?.toLowerCase() === "bearer") ? parts[1] : null;

    if (!token) return res.status(401).json({ error: "No token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload esperado: { id, email, role, ... }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Solo admin" });
  }
  next();
}
