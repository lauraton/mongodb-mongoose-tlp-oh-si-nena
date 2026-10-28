import { Router } from "express";
import {
  createInstructor,
  deleteInstructor,
  getAllInstructors,
  getInstructorById,
  updateInstructor,
} from "../controllers/instructor.controller.js";
import {
  createInstructorValidation,
  instructorIdValidation,
  updateInstructorValidation,
} from "../middlewares/validations/instructor.validation.js";
import { validator } from "../middlewares/validator.middleware.js";

export const instructorRouter = Router();

instructorRouter.post(
  "/instructors",
  createInstructorValidation,
  validator,
  createInstructor,
);

instructorRouter.get("/instructors", getAllInstructors);

instructorRouter.get(
  "/instructors/:id",
  instructorIdValidation,
  validator,
  getInstructorById,
);

instructorRouter.put(
  "/instructors/:id",
  instructorIdValidation,
  updateInstructorValidation,
  validator,
  updateInstructor,
);

instructorRouter.delete(
  "/instructors/:id",
  instructorIdValidation,
  validator,
  deleteInstructor,
);
