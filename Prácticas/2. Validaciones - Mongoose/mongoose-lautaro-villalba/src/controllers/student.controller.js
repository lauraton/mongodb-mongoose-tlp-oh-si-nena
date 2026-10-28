import { matchedData } from "express-validator";
import { studentModel } from "../models/student.model.js";
import { studentProfileModel } from "../models/studentProfile.model.js";
import { courseModel } from "../models/course.model.js";

export const createStudent = async (req, res) => {
  try {
    const validatedData = matchedData(req);

    const student = await studentModel.create(validatedData);

    return res
      .status(201)
      .json({ msg: "Student creado exitosamente", data: student });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const getAll = await studentModel
      .find({ isActive: true })
      .populate({ path: "profile", match: { isActive: true } })
      .populate({
        path: "courses",
        match: { isActive: true },
        select: "name description hours year",
      });
    return res
      .status(200)
      .json({ msg: "Students encontrados correctamente", data: getAll });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const getById = await studentModel
      .findOne({ _id: id, isActive: true })
      .populate({
        path: "profile",
        match: { isActive: true },
      })
      .populate({
        path: "courses",
        match: { isActive: true },
        select: "name description hours year",
      });
    if (!getById) {
      return res.status(404).json({ msg: "Student no encontrado" });
    }

    return res.status(200).json({ msg: "Student encontrado", data: getById });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

export const updateStudent = async (req, res) => {
  try {
    // agarro los datos que podrían actualizarse (dni no pq es incambiable)
    const { id, ...changes } = matchedData(req);

    //Declaro el resultado para actualizarlo, SIEMPRE va primero el ID (pq lo tiene q identificar)
    // Y luego los cambios, así funciona mongo. ¿Por qué? Ayuda a reconocer lo q querés que se cambie.
    // Caso contrario, podrían meter cualquier cosa en el body y podría generar errores
    const result = await studentModel.updateOne(
      { _id: id, isActive: true },
      changes,
    );

    //En el caso donde NO se encuentre el ID, se muestra esto:
    //.matchedCount habla de los resultados encontrados y q coinciden con el id ingresado
    // Lo de update se ejecuta igual, pero te avisa si sí se hizo o no (porque no encontró el id)
    if (result.matchedCount === 0) {
      return res.status(404).json({ msg: "Student no encontrado" });
    }

    return res.status(200).json({ msg: "Student actualizado correctamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStudent = await studentModel.updateOne(
      {
        _id: id,
        isActive: true,
      },
      { isActive: false },
    );

    if (deletedStudent.matchedCount === 0) {
      return res.status(404).json({ msg: "Student no encontrado" });
    }

    await studentProfileModel.updateOne({ student: id }, { isActive: false });

    // Cascada N:M: lo saco de todos los cursos donde estaba inscripto
    await courseModel.updateMany({ students: id }, { $pull: { students: id } });

    return res.status(200).json({ msg: "Student borrado exitosamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};
