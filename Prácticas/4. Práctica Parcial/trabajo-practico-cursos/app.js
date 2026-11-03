import express from "express";
import "dotenv/config";
import { startDB } from "./src/config/database.js";

const PORT = process.env.PORT || 3007;
const app = express();

app.listen(PORT, async () => {
  await startDB();
  console.log("Servidor corriendo en el puerto", PORT);
});
