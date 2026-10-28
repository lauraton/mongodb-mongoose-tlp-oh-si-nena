import mongoose from "mongoose";

export const startDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Base de datos conectada.");
  } catch (error) {
    console.log(error);
    console.log("Error al conectar la base de datos");
  }
};
