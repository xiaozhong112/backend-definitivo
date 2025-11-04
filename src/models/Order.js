import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  variant: {
    volumeMl: Number,
    price: Number
  },
  qty: { type: Number, min: 1, default: 1 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: [itemSchema],
  total: { type: Number, min: 0, required: true },
  status: { type: String, enum: ["pending", "paid", "shipped", "completed", "cancelled"], default: "pending" }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
