import { model, Schema, Types } from "mongoose";

const courseSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    hours: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    students: [
      {
        type: Types.ObjectId,
        ref: "Student",
      },
    ],
    instructor: {
      type: Types.ObjectId,
      ref: "Instructor",
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

export const courseModel = model("Course", courseSchema);
