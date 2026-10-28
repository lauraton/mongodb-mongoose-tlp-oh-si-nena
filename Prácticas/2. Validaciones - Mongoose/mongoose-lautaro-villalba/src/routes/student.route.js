import { Router } from "express";
import {
  getStudentById,
  createStudent,
  getAllStudents,
  updateStudent,
  deleteStudent,
} from "../controllers/student.controller.js";
import {
  createStudentValidation,
  studentIdValidation,
  updateStudentValidation,
} from "../middlewares/validations/student.validation.js";
import { validator } from "../middlewares/validator.middleware.js";

export const studentRouter = Router();

studentRouter.post(
  "/students",
  createStudentValidation,
  validator,
  createStudent,
);

studentRouter.get("/students", getAllStudents);

studentRouter.get(
  "/students/:id",
  studentIdValidation,
  validator,
  getStudentById,
);

studentRouter.put(
  "/students/:id",
  studentIdValidation,
  updateStudentValidation,
  validator,
  updateStudent,
);

studentRouter.delete(
  "/students/:id",
  studentIdValidation,
  validator,
  deleteStudent,
);
