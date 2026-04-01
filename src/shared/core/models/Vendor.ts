import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVendor extends Document {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstin?: string;
  licenseNumber?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    address: { type: String, required: true, trim: true },
    gstin: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Vendor: Model<IVendor> =
  mongoose.models.Vendor ?? mongoose.model<IVendor>("Vendor", VendorSchema);

export default Vendor;
