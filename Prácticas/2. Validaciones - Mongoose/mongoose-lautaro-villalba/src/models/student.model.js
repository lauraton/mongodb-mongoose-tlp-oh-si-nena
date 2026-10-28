import { model, Schema } from "mongoose";

const studentSchema = new Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    dni: {
      type: Number,
      required: true,
      unique: true,
    },
    address: {
      city: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      street: {
        type: String,
        required: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

studentSchema.virtual("profile", {
  ref: "StudentProfile",
  localField: "_id",
  foreignField: "student",
  justOne: true,
});

studentSchema.virtual("courses", {
  ref: "Course",
  localField: "_id",
  foreignField: "students",
});

export const studentModel = model("Student", studentSchema);
