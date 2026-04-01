import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettings extends Document {
  pharmacyName: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;
  gstin?: string;
  panNumber?: string;
  license1?: string;
  license2?: string;
  tagline?: string;
  lowStockThreshold: number;
  expiryAlertDays: number;
}

const SettingsSchema = new Schema<ISettings>(
  {
    pharmacyName: { type: String, default: "My Pharmacy", trim: true },
    address: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
    website: { type: String, default: "", trim: true },
    gstin: { type: String, default: "", trim: true },
    panNumber: { type: String, default: "", trim: true },
    license1: { type: String, default: "", trim: true },
    license2: { type: String, default: "", trim: true },
    tagline: { type: String, default: "", trim: true },
    lowStockThreshold: { type: Number, default: 10 },
    expiryAlertDays: { type: Number, default: 30 },
  },
  { timestamps: true }
);

// Singleton pattern — only one settings document
const Settings: Model<ISettings> =
  mongoose.models.Settings ??
  mongoose.model<ISettings>("Settings", SettingsSchema);

export default Settings;
