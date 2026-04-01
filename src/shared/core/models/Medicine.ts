import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBatch {
  batchNumber: string;
  expiryDate: Date;
  purchasePrice: number;
  sellingPrice: number;
  gst: number;
  quantity: number;
}

export interface IMedicine extends Document {
  name: string;
  genericName?: string;
  category: string;
  manufacturer: string;
  description?: string;
  sku: string;
  unit: string;
  requiresPrescription: boolean;
  batches: IBatch[];
  quantity: number;
  lowStockThreshold: number;
  photo?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>({
  batchNumber: { type: String, required: true, trim: true },
  expiryDate: { type: Date, required: true },
  purchasePrice: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  gst: { type: Number, required: true, min: 0, max: 28 },
  quantity: { type: Number, required: true, min: 0 },
});

const MedicineSchema = new Schema<IMedicine>(
  {
    name: { type: String, required: true, trim: true },
    genericName: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    manufacturer: { type: String, required: true, trim: true },
    description: { type: String },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    unit: { type: String, required: true, default: "strip", trim: true },
    requiresPrescription: { type: Boolean, default: false },
    batches: { type: [BatchSchema], default: [] },
    quantity: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    photo: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MedicineSchema.index({ name: "text", genericName: "text", sku: "text" });

const Medicine: Model<IMedicine> =
  mongoose.models.Medicine ??
  mongoose.model<IMedicine>("Medicine", MedicineSchema);

export default Medicine;
