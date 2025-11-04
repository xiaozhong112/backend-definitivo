// src/models/Producto.js
import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    volumeMl: { type: Number, required: true },
    price:    { type: Number, required: true, min: 0 },
    stock:    { type: Number, required: true, min: 0, default: 0 },
    sku:      { type: String }
  },
  { _id: false }
);

const productoSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    slug:         { type: String, unique: true, index: true },
    description:  { type: String, default: "" },
    floralSource: {
      type: String,
      enum: ["ulmo","quillay","multiflora","eucalipto","otras"],
      default: "multiflora"
    },
    imageUrl:     { type: String },
    isActive:     { type: Boolean, default: true, index: true },
    variants:     {
      type: [variantSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "Se requiere al menos una variante"
      }
    }
  },
  { timestamps: true }
);

// Helper simple para slug
function toSlug(str = "") {
  return String(str)
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Pre save: asigna slug si no existe
productoSchema.pre("save", function(next) {
  if (!this.slug && this.name) {
    this.slug = toSlug(this.name);
  }
  next();
});

// Pre findOneAndUpdate: si cambia el name, recalcula slug
productoSchema.pre("findOneAndUpdate", function(next) {
  const update = this.getUpdate() || {};
  if (update.name) {
    update.slug = toSlug(update.name);
    this.setUpdate(update);
  }
  next();
});

// Índices útiles
productoSchema.index({ isActive: 1, createdAt: -1 });
productoSchema.index({ name: "text", description: "text" });

export default mongoose.model("Producto", productoSchema);
