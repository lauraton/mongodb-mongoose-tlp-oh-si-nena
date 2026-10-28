import { Schema, model, Types } from "mongoose";

const studentProfileSchema = new Schema(
  {
    student: {
      type: Types.ObjectId,
      ref: "Student",
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      required: false,
    },
    birth_date: {
      type: Date,
      required: true,
    },
    enrollment_year: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const studentProfileModel = model(
  "StudentProfile",
  studentProfileSchema,
);
