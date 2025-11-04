// src/models/Usuario.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const usuarioSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ["user", "admin"], default: "user", index: true },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

usuarioSchema.pre("save", async function(next){
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

usuarioSchema.pre("findOneAndUpdate", async function(next){
  const update = this.getUpdate() || {};
  if (update.password) {
    update.password = await bcrypt.hash(update.password, 10);
    this.setUpdate(update);
  }
  next();
});

usuarioSchema.methods.comparePassword = function(p){
  return bcrypt.compare(p, this.password);
};

// ⬇️ Oculta password en JSON
usuarioSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  }
});

export default mongoose.model("Usuario", usuarioSchema);
