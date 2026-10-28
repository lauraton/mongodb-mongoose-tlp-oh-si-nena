import { body, param } from "express-validator";
import { studentModel } from "../../models/student.model.js";

export const createStudentValidation = [
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
  body("dni")
    .notEmpty()
    .withMessage("dni no puede estar vacío")
    .isInt()
    .withMessage("dni debe estar compuesto por números")
    .isLength({ min: 8, max: 8 })
    .withMessage("dni debe tener un mínimo y máximo de 8 caracteres")
    .custom(async (dni) => {
      const student = await studentModel.findOne({ dni });
      if (student) {
        throw new Error("Ya existe un student con ese dni");
      }
      return true;
    }),
  body("address")
    .notEmpty()
    .withMessage("address es obligatorio")
    .isObject()
    .withMessage("address debe ser un objeto"),
  body("address.city")
    .notEmpty()
    .withMessage("city no puede estar vacío")
    .isString()
    .withMessage("city debe ser texto")
    .isLength({ min: 2, max: 50 })
    .withMessage("city debe tener de 2 a 50 caracteres"),
  body("address.country")
    .notEmpty()
    .withMessage("country no puede estar vacío")
    .isString()
    .withMessage("country debe ser texto")
    .isLength({ min: 2, max: 50 })
    .withMessage("country debe tener de 2 a 50 caracteres"),
  body("address.street")
    .notEmpty()
    .withMessage("street no puede estar vacío")
    .isString()
    .withMessage("street debe ser texto")
    .isLength({ min: 2, max: 100 })
    .withMessage("street debe tener de 2 a 100 caracteres"),
];

export const updateStudentValidation = [
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
  body("address")
    .optional()
    .notEmpty()
    .withMessage("address es obligatorio")
    .isObject()
    .withMessage("address debe ser un objeto"),
  body("address.city")
    .if(body("address").exists())
    .notEmpty()
    .withMessage("city no puede estar vacío")
    .isString()
    .withMessage("city debe ser texto")
    .isLength({ min: 2, max: 50 })
    .withMessage("city debe tener de 2 a 50 caracteres"),
  body("address.country")
    .if(body("address").exists())
    .notEmpty()
    .withMessage("country no puede estar vacío")
    .isString()
    .withMessage("country debe ser texto")
    .isLength({ min: 2, max: 50 })
    .withMessage("country debe tener de 2 a 50 caracteres"),
  body("address.street")
    .if(body("address").exists())
    .notEmpty()
    .withMessage("street no puede estar vacío")
    .isString()
    .withMessage("street debe ser texto")
    .isLength({ min: 2, max: 100 })
    .withMessage("street debe tener de 2 a 100 caracteres"),
];

export const studentIdValidation = [
  param("id").isMongoId().withMessage("El id no es un ObjectId válido"),
];
