import { matchedData } from "express-validator";
import { studentProfileModel } from "../models/studentProfile.model.js";

export const createStudentProfile = async (req, res) => {
  try {
    const validatedData = matchedData(req);

    const profile = await studentProfileModel.create(validatedData);

    return res
      .status(201)
      .json({ msg: "Perfil creado exitosamente", data: profile });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

export const getAllStudentProfiles = async (req, res) => {
  try {
    const profiles = await studentProfileModel
      .find({ isActive: true })
      .populate("student");

    return res
      .status(200)
      .json({ msg: "Perfiles encontrados correctamente", data: profiles });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

export const getStudentProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await studentProfileModel
      .findOne({ _id: id, isActive: true })
      .populate("student");

    if (!profile) {
      return res.status(404).json({ msg: "Perfil no encontrado" });
    }

    return res.status(200).json({ msg: "Perfil encontrado", data: profile });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

export const updateStudentProfile = async (req, res) => {
  try {
    const { id, ...changes } = matchedData(req);

    const result = await studentProfileModel.updateOne(
      { _id: id, isActive: true },
      changes,
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ msg: "Perfil no encontrado" });
    }

    return res.status(200).json({ msg: "Perfil actualizado correctamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

export const deleteStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await studentProfileModel.updateOne(
      { _id: id, isActive: true },
      { isActive: false },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ msg: "Perfil no encontrado" });
    }

    return res.status(200).json({ msg: "Perfil borrado exitosamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};
