import { Router } from "express";
import {
  addStudentToCourseValidation,
  courseIdValidation,
  createCourseValidation,
  updateCourseValidation,
} from "../middlewares/validations/course.validation.js";
import {
  addStudentToCourse,
  createCourse,
  deleteCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
} from "../controllers/course.controller.js";
import { validator } from "../middlewares/validator.middleware.js";

export const courseRouter = Router();

courseRouter.post("/courses", createCourseValidation, validator, createCourse);
courseRouter.get("/courses", getAllCourses);
courseRouter.get("/courses/:id", courseIdValidation, validator, getCourseById);
courseRouter.put(
  "/courses/:id",
  courseIdValidation,
  updateCourseValidation,
  validator,
  updateCourse,
);
courseRouter.delete("/courses/:id", courseIdValidation, validator, deleteCourse);
courseRouter.post(
  "/courses/:id/students",
  addStudentToCourseValidation,
  validator,
  addStudentToCourse,
);
