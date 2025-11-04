import Producto from "../models/Producto.js"; // ajusta la ruta

// GET /api/productos
// Por defecto: SOLO activos (catálogo público)
// Admin puede pedir ?status=inactive o ?all=true
export async function listProductos(req, res, next){
  try{
    const { status, all } = req.query;

    // si pide all=true, solo válido para admin
    if (all === "true") {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Requiere admin para all=true" });
      }
      const allDocs = await Producto.find({}).lean();
      return res.json(allDocs);
    }

    // status=inactive para ver solo inactivos (si no es admin, igual podrías bloquear)
    if (status === "inactive") {
      if (!req.user || req.user.role !== "admin") {
        // si quieres permitir a cualquiera ver inactivos, elimina este if
        return res.status(403).json({ error: "Requiere admin para inactivos" });
      }
      const inactivos = await Producto.find({ isActive: false }).lean();
      return res.json(inactivos);
    }

    // por defecto: solo activos (público)
    const activos = await Producto.find({ isActive: true }).lean();
    return res.json(activos);
  }catch(err){ next(err); }
}

// GET /api/productos/all (admin)
export async function listAllProductosAdmin(_req, res, next){
  try{
    const docs = await Producto.find({}).lean();
    res.json(docs);
  }catch(err){ next(err); }
}

// POST /api/productos (admin)
export async function createProducto(req, res, next){
  try{
    const doc = await Producto.create(req.body);
    res.status(201).json(doc);
  }catch(err){ next(err); }
}

// PUT /api/productos/:id (admin)
export async function updateProducto(req, res, next){
  try{
    const { id } = req.params;
    const doc = await Producto.findByIdAndUpdate(id, req.body, { new: true });
    if(!doc) return res.status(404).json({ error: "No encontrado" });
    res.json(doc);
  }catch(err){ next(err); }
}

// PATCH /api/productos/:id/toggle (admin)
export async function toggleProducto(req, res, next){
  try{
    const { id } = req.params;
    const doc = await Producto.findById(id);
    if(!doc) return res.status(404).json({ error: "No encontrado" });
    doc.isActive = !doc.isActive;
    await doc.save();
    res.json({ ok: true, isActive: doc.isActive });
  }catch(err){ next(err); }
}

// DELETE /api/productos/:id (admin)
export async function deleteProducto(req, res, next){
  try{
    const { id } = req.params;
    const doc = await Producto.findByIdAndDelete(id);
    if(!doc) return res.status(404).json({ error: "No encontrado" });
    res.json({ ok: true });
  }catch(err){ next(err); }
}
