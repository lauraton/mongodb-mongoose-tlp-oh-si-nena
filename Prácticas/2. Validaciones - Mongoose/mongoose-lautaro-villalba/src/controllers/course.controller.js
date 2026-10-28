import { matchedData } from "express-validator";
import { courseModel } from "../models/course.model.js";

export const createCourse = async (req, res) => {
  try {
    const validatedData = matchedData(req);

    const course = await courseModel.create(validatedData);

    return res
      .status(201)
      .json({ msg: "Curso creado exitosamente", data: course });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

export const getAllCourses = async (req, res) => {
  try {
    const courses = await courseModel
      .find({ isActive: true })
      .populate({
        path: "instructor",
        match: { isActive: true },
        select: "first_name last_name email title",
      })
      .populate({
        path: "students",
        match: { isActive: true },
        select: "first_name last_name dni",
      });

    return res
      .status(200)
      .json({ msg: "Cursos encontrados correctamente", data: courses });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await courseModel
      .findOne({ _id: id, isActive: true })
      .populate({
        path: "instructor",
        match: { isActive: true },
        select: "first_name last_name email title",
      })
      .populate({
        path: "students",
        match: { isActive: true },
        select: "first_name last_name dni",
      });

    if (!course) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    return res.status(200).json({ msg: "Curso encontrado", data: course });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { id, ...changes } = matchedData(req);

    const result = await courseModel.updateOne(
      { _id: id, isActive: true },
      changes,
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    return res.status(200).json({ msg: "Curso actualizado correctamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await courseModel.updateOne(
      { _id: id, isActive: true },
      { isActive: false },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    return res.status(200).json({ msg: "Curso borrado exitosamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

export const addStudentToCourse = async (req, res) => {
  try {
    const { id, student } = matchedData(req);

    // $addToSet agrega el id al array solo si todavía no está
    const result = await courseModel.updateOne(
      { _id: id, isActive: true },
      { $addToSet: { students: student } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ msg: "Curso no encontrado" });
    }

    return res
      .status(200)
      .json({ msg: "Student agregado al curso exitosamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};
