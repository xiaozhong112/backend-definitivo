import "dotenv/config";
import mongoose from "mongoose";
import Usuario from "../src/models/Usuario.js";

(async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI no está definido");
    await mongoose.connect(process.env.MONGO_URI, { dbName: "miel" });
    console.log("Conectado a Mongo");

    const email = "admin@honeysweeat.cl";
    const password = "admin123";
    const name = "Administrador";

    let user = await Usuario.findOne({ email });
    if (user) {
      console.log("Ya existe un admin con ese correo.");
      process.exit(0);
    }

    user = await Usuario.create({ name, email, password, role: "admin" });
    console.log("Admin creado:", { id: user._id, email: user.email, role: user.role });
    process.exit(0);
  } catch (e) {
    console.error("Error:", e.message);
    process.exit(1);
  }
})();
