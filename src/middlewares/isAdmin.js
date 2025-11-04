export function isAdmin(req, _res, next){
  // asumiendo que verifyToken puso req.user
  if (req.user?.role === "admin") return next();
  const err = new Error("Requiere rol admin");
  err.status = 403;
  throw err;
}
