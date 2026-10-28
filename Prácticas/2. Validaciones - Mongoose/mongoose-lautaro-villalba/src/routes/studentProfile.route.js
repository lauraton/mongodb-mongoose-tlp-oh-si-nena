import { Router } from "express";
import {
  createStudentProfile,
  deleteStudentProfile,
  getAllStudentProfiles,
  getStudentProfileById,
  updateStudentProfile,
} from "../controllers/studentProfile.controller.js";
import {
  createStudentProfileValidation,
  studentProfileIdValidation,
  updateStudentProfileValidation,
} from "../middlewares/validations/studentProfile.validation.js";
import { validator } from "../middlewares/validator.middleware.js";

export const studentProfileRouter = Router();

studentProfileRouter.post(
  "/student-profiles",
  createStudentProfileValidation,
  validator,
  createStudentProfile,
);

studentProfileRouter.get("/student-profiles", getAllStudentProfiles);

studentProfileRouter.get(
  "/student-profiles/:id",
  studentProfileIdValidation,
  validator,
  getStudentProfileById,
);

studentProfileRouter.put(
  "/student-profiles/:id",
  studentProfileIdValidation,
  updateStudentProfileValidation,
  validator,
  updateStudentProfile,
);

studentProfileRouter.delete(
  "/student-profiles/:id",
  studentProfileIdValidation,
  validator,
  deleteStudentProfile,
);
