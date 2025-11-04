import "dotenv/config";
import { connectDB } from "./config/db.js";
import app from "./app.js";

const PORT = process.env.PORT || 4000;

(async ()=>{
  await connectDB(process.env.MONGO_URI);
  app.listen(PORT, ()=> console.log(`API miel corriendo en http://localhost:${PORT}`));
})();
