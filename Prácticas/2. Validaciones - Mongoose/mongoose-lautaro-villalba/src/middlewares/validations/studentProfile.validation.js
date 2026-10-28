import { body, param } from "express-validator";
import { studentModel } from "../../models/student.model.js";
import { studentProfileModel } from "../../models/studentProfile.model.js";

export const createStudentProfileValidation = [
  body("student")
    .notEmpty()
    .withMessage("student no puede quedar vacío")
    .isMongoId()
    .withMessage("student debe ser un id válido de mongo")
    .custom(async (studentId) => {
      const student = await studentModel.findOne({
        _id: studentId,
        isActive: true,
      });
      if (!student) {
        throw new Error("El student no existe");
      }
      return true;
    })
    .custom(async (studentId) => {
      const profile = await studentProfileModel.findOne({ student: studentId });
      if (profile) {
        throw new Error("Ese student ya tiene un perfil");
      }
      return true;
    }),

  body("email")
    .notEmpty()
    .withMessage("email no puede estar vacío")
    .isEmail()
    .withMessage("email debe tener el formato apropiado")
    .custom(async (email) => {
      const profile = await studentProfileModel.findOne({ email });
      if (profile) {
        throw new Error("Ya existe un perfil con ese email");
      }
      return true;
    }),

  body("phone")
    .notEmpty()
    .withMessage("phone no puede estar vacío")
    .isString()
    .withMessage("phone debe ser texto")
    .isLength({ min: 8, max: 15 })
    .withMessage("phone debe tener de 8 a 15 caracteres")
    .custom(async (phone, { req }) => {
      const profile = await studentProfileModel.findOne({
        phone,
      });
      if (profile) {
        throw new Error("Ya existe un perfil con ese phone");
      }
      return true;
    }),
  body("bio")
    .optional()
    .isString()
    .withMessage("bio debe ser texto")
    .isLength({ max: 300 })
    .withMessage("bio debe tener hasta 300 caracteres"),

  body("birth_date")
    .notEmpty()
    .withMessage("birth_date no puede estar vacío")
    .isDate()
    .withMessage("birth_date debe ser una fecha válida (YYYY-MM-DD)"),
  body("enrollment_year")
    .notEmpty()
    .withMessage("enrollment_year no puede estar vacío")
    .isInt({ min: 1990, max: new Date().getFullYear() })
    .withMessage("enrollment_year debe ser un año válido"),
];

export const updateStudentProfileValidation = [
  body("email")
    .optional()
    .isEmail()
    .withMessage("email debe tener el formato apropiado")
    .custom(async (email, { req }) => {
      const profile = await studentProfileModel.findOne({
        email,
        _id: { $ne: req.params.id },
      });
      if (profile) {
        throw new Error("Ya existe un perfil con ese email");
      }
      return true;
    }),

  body("phone")
    .optional()
    .notEmpty()
    .withMessage("phone no puede estar vacío")
    .isString()
    .withMessage("phone debe ser texto")
    .isLength({ min: 8, max: 15 })
    .withMessage("phone debe tener de 8 a 15 caracteres")
    .custom(async (phone, { req }) => {
      const profile = await studentProfileModel.findOne({
        phone,
        _id: { $ne: req.params.id },
      });
      if (profile) {
        throw new Error("Ya existe un perfil con ese phone");
      }
      return true;
    }),

  body("bio")
    .optional()
    .isString()
    .withMessage("bio debe ser texto")
    .isLength({ max: 300 })
    .withMessage("bio debe tener hasta 300 caracteres"),

  body("birth_date")
    .optional()
    .isDate()
    .withMessage("birth_date debe ser una fecha válida (YYYY-MM-DD)"),

  body("enrollment_year")
    .optional()
    .isInt({ min: 1990, max: new Date().getFullYear() })
    .withMessage("enrollment_year debe ser un año válido"),
];

export const studentProfileIdValidation = [
  param("id").isMongoId().withMessage("El id no es un ObjectId válido"),
];
