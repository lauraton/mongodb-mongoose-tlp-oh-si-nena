import { matchedData } from "express-validator";
import { instructorModel } from "../models/instructor.model.js";
import { courseModel } from "../models/course.model.js";

export const createInstructor = async (req, res) => {
  try {
    const validatedData = matchedData(req);

    const instructor = await instructorModel.create(validatedData);

    return res
      .status(201)
      .json({ msg: "Instructor creado exitosamente", data: instructor });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

export const getAllInstructors = async (req, res) => {
  try {
    const instructors = await instructorModel
      .find({ isActive: true })
      .populate({
        path: "courses",
        match: { isActive: true },
        select: "name description hours year",
      });

    return res.status(200).json({
      msg: "Instructors encontrados correctamente",
      data: instructors,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

export const getInstructorById = async (req, res) => {
  try {
    const { id } = req.params;
    const instructor = await instructorModel
      .findOne({ _id: id, isActive: true })
      .populate({
        path: "courses",
        match: { isActive: true },
        select: "name description hours year",
      });

    if (!instructor) {
      return res.status(404).json({ msg: "Instructor no encontrado" });
    }

    return res
      .status(200)
      .json({ msg: "Instructor encontrado", data: instructor });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

export const updateInstructor = async (req, res) => {
  try {
    const { id, ...changes } = matchedData(req);

    const result = await instructorModel.updateOne(
      { _id: id, isActive: true },
      changes,
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ msg: "Instructor no encontrado" });
    }

    return res
      .status(200)
      .json({ msg: "Instructor actualizado correctamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

export const deleteInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await instructorModel.updateOne(
      { _id: id, isActive: true },
      { isActive: false },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ msg: "Instructor no encontrado" });
    }

    // Cascada: desactivo también los cursos del instructor
    await courseModel.updateMany({ instructor: id }, { isActive: false });

    return res.status(200).json({ msg: "Instructor borrado exitosamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};
