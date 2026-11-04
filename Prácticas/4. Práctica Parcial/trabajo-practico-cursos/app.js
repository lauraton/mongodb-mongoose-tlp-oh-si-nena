import express from "express";
import "dotenv/config";
import { startDB } from "./src/config/database.js";
import cookieParser from "cookie-parser";

const PORT = process.env.PORT || 3007;
const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.listen(PORT, async () => {
  await startDB();
  console.log("Servidor corriendo en el puerto", PORT);
});
