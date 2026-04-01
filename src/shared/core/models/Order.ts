import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrderItem {
  medicine: mongoose.Types.ObjectId;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  gst: number;
  discount: number;
  total: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  user?: mongoose.Types.ObjectId;
  customerName?: string;
  customerPhone?: string;
  type: "online" | "pos";
  items: IOrderItem[];
  subtotal: number;
  totalDiscount: number;
  totalGst: number;
  totalAmount: number;
  paymentMethod: "cash" | "card" | "upi" | "razorpay";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  status: "pending" | "confirmed" | "processing" | "completed" | "cancelled";
  prescriptionUrl?: string;
  prescriptionStatus?: "pending" | "approved" | "rejected";
  notes?: string;
  invoiceNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  medicine: { type: Schema.Types.ObjectId, ref: "Medicine", required: true },
  medicineName: { type: String, required: true },
  batchNumber: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  gst: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true, min: 0 },
});

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    customerName: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
    type: { type: String, enum: ["online", "pos"], required: true },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    totalDiscount: { type: Number, default: 0 },
    totalGst: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "razorpay"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "completed", "cancelled"],
      default: "pending",
    },
    prescriptionUrl: { type: String },
    prescriptionStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
    },
    notes: { type: String },
    invoiceNumber: { type: String },
  },
  { timestamps: true }
);

OrderSchema.index({ orderNumber: 1, createdAt: -1 });

async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  const prefix = `ORD${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const count = (await mongoose.models.Order?.countDocuments()) ?? 0;
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

OrderSchema.pre("save", async function () {
  if (!this.orderNumber) {
    this.orderNumber = await generateOrderNumber();
  }
});

const Order: Model<IOrder> =
  mongoose.models.Order ?? mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
