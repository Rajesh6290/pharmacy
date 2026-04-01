import mongoose, { Schema, Document } from "mongoose";

export interface IPrescription extends Document {
  name: string;
  phone: string;
  prescriptionUrl: string;
  publicId: string;
  status: "pending" | "reviewed" | "called";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionSchema = new Schema<IPrescription>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    prescriptionUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "reviewed", "called"],
      default: "pending",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

const Prescription =
  (mongoose.models.Prescription as mongoose.Model<IPrescription>) ||
  mongoose.model<IPrescription>("Prescription", PrescriptionSchema);

export default Prescription;
