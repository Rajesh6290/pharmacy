import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/shared/config/db";
import Order from "@/shared/core/models/Order";
import Medicine from "@/shared/core/models/Medicine";
import { getJwtSecret } from "@/shared/hooks/servenEnv";

interface JwtPayload {
  id: string;
  role: string;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = 10;
    const skip = (page - 1) * limit;

    // Admin sees all, customers see own
    const filter =
      decoded.role === "admin" || decoded.role === "pharmacist"
        ? {}
        : { user: decoded.id };

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("GET orders error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── POST — create online order (customer checkout after Razorpay) ────────────
interface OrderItemInput {
  medicine: string;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  gst: number;
  discount?: number;
  total: number;
  prescriptionUrl?: string;
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;

    const body = (await req.json()) as {
      items: OrderItemInput[];
      subtotal: number;
      totalGst: number;
      totalAmount: number;
      paymentMethod: string;
      paymentStatus: string;
      prescriptionUrl?: string;
      razorpayPaymentId?: string;
      customerName?: string;
      customerPhone?: string;
      notes?: string;
    };

    if (!body.items?.length) {
      return NextResponse.json(
        { success: false, message: "No items in order" },
        { status: 400 }
      );
    }

    await connectDB();

    // Deduct stock for each item (same as POS)
    for (const item of body.items) {
      const med = await Medicine.findById(item.medicine);
      if (!med) {
        return NextResponse.json(
          {
            success: false,
            message: `Medicine not found: ${item.medicineName}`,
          },
          { status: 400 }
        );
      }
      const batchIdx = med.batches.findIndex(
        (b) => b.batchNumber === item.batchNumber
      );
      if (batchIdx < 0) {
        return NextResponse.json(
          { success: false, message: `Batch ${item.batchNumber} not found` },
          { status: 400 }
        );
      }
      if (med.batches[batchIdx].quantity < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient stock for ${item.medicineName}`,
          },
          { status: 400 }
        );
      }
      med.batches[batchIdx].quantity -= item.quantity;
      med.quantity = med.batches.reduce((s, b) => s + b.quantity, 0);
      await med.save();
    }

    const order = await Order.create({
      user: decoded.id,
      type: "online",
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      items: body.items.map((i) => ({
        medicine: i.medicine,
        medicineName: i.medicineName,
        batchNumber: i.batchNumber,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        gst: i.gst,
        discount: i.discount ?? 0,
        total: i.total,
      })),
      subtotal: body.subtotal,
      totalDiscount: 0,
      totalGst: body.totalGst,
      totalAmount: body.totalAmount,
      paymentMethod: body.paymentMethod ?? "razorpay",
      paymentStatus: body.paymentStatus ?? "paid",
      status: "confirmed",
      prescriptionUrl: body.prescriptionUrl,
      prescriptionStatus: body.prescriptionUrl ? "pending" : undefined,
      notes: body.razorpayPaymentId
        ? `Razorpay: ${body.razorpayPaymentId}`
        : body.notes,
    });

    return NextResponse.json(
      { success: true, data: { order } },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST orders error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
