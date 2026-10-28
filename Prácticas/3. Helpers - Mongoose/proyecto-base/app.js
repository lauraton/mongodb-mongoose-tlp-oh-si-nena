import express from "express";
import "dotenv/config";
import { startDB } from "./src/config/database.js";

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

app.listen(PORT, async () => {
  await startDB();
  console.log("Servidor corriendo en el puerto", PORT);
});
