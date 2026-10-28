import { body, param } from "express-validator";
import { instructorModel } from "../../models/instructor.model.js";

export const createInstructorValidation = [
  body("first_name")
    .notEmpty()
    .withMessage("first_name no puede estar vacío")
    .isAlpha("es-ES", { ignore: " " })
    .withMessage("first_name debe ser sólo letras")
    .isLength({ min: 3, max: 50 })
    .withMessage("first_name debe tener de 3 a 50 caracteres"),
  body("last_name")
    .notEmpty()
    .withMessage("last_name no puede estar vacío")
    .isAlpha("es-ES", { ignore: " " })
    .withMessage("last_name debe tener sólo letras")
    .isLength({ min: 3, max: 50 })
    .withMessage("last_name debe tener de 3 a 50 caracteres"),
  body("email")
    .notEmpty()
    .withMessage("email no puede estar vacío")
    .isEmail()
    .withMessage("email debe tener el formato apropiado")
    .custom(async (email) => {
      const instructor = await instructorModel.findOne({ email });
      if (instructor) {
        throw new Error("Ya existe un instructor con ese email");
      }
      return true;
    }),
  body("title")
    .notEmpty()
    .withMessage("title no puede estar vacío")
    .isString()
    .withMessage("title debe ser un string"),
];

export const updateInstructorValidation = [
  body("first_name")
    .optional()
    .notEmpty()
    .withMessage("first_name no puede estar vacío")
    .isAlpha("es-ES", { ignore: " " })
    .withMessage("first_name debe ser sólo letras")
    .isLength({ min: 3, max: 50 })
    .withMessage("first_name debe tener de 3 a 50 caracteres"),
  body("last_name")
    .optional()
    .notEmpty()
    .withMessage("last_name no puede estar vacío")
    .isAlpha("es-ES", { ignore: " " })
    .withMessage("last_name debe tener sólo letras")
    .isLength({ min: 3, max: 50 })
    .withMessage("last_name debe tener de 3 a 50 caracteres"),
  body("email")
    .optional()
    .notEmpty()
    .withMessage("email no puede estar vacío")
    .isEmail()
    .withMessage("email debe tener el formato apropiado")
    .custom(async (email, { req }) => {
      const instructor = await instructorModel.findOne({
        email,
        _id: { $ne: req.params.id },
      });
      if (instructor) {
        throw new Error("Ya existe un instructor con ese email");
      }
      return true;
    }),
  body("title")
    .optional()
    .notEmpty()
    .withMessage("title no puede estar vacío")
    .isString()
    .withMessage("title debe ser un string")
    .isLength({ min: 6, max: 167 })
    .withMessage("title debe tener al menos 6 a 167 caracteres"),
];

export const instructorIdValidation = [
  param("id").isMongoId().withMessage("El id no es un ObjectId válido"),
];
