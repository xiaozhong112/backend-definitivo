import mongoose from "mongoose";

export async function connectDB(uri){
  if (!uri) throw new Error("MONGO_URI no definido");
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { dbName: "miel" });
  console.log("MongoDB conectado");
}
