import express from "express";
import "dotenv/config";
import { startDB } from "./src/config/database.js";
import { studentRouter } from "./src/routes/student.route.js";
import { studentProfileRouter } from "./src/routes/studentProfile.route.js";
import { instructorRouter } from "./src/routes/instructor.route.js";
import { courseRouter } from "./src/routes/course.route.js";

const PORT = process.env.PORT || 3003;
const app = express();

app.use(express.json());
app.use("/api", studentRouter);
app.use("/api", studentProfileRouter);
app.use("/api", instructorRouter);
app.use("/api", courseRouter);

app.listen(PORT, async () => {
  await startDB();
  console.log("Servidor corriendo en el puerto", PORT);
});
