import jwt from "jsonwebtoken";

export function signToken(payload, opts = {}) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET no configurado");
  // 7d por defecto, ajusta si quieres
  const options = { expiresIn: "7d", ...opts };
  return jwt.sign(payload, secret, options);
}
