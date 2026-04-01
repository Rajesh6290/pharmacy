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
    if (decoded.role !== "admin" && decoded.role !== "pharmacist") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await req.json();
    const {
      items,
      customerName,
      customerPhone,
      paymentMethod,
      subtotal,
      totalDiscount,
      totalGst,
      totalAmount,
    } = body;

    if (!items?.length) {
      return NextResponse.json(
        { success: false, message: "No items in the bill" },
        { status: 400 }
      );
    }

    // Deduct stock from batches
    for (const item of items) {
      const medicine = await Medicine.findById(item.medicine);
      if (!medicine) {
        return NextResponse.json(
          {
            success: false,
            message: `Medicine not found: ${item.medicineName}`,
          },
          { status: 404 }
        );
      }

      const batch = medicine.batches.find(
        (b) => b.batchNumber === item.batchNumber
      );
      if (!batch) {
        return NextResponse.json(
          { success: false, message: `Batch not found: ${item.batchNumber}` },
          { status: 404 }
        );
      }

      if (batch.quantity < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient stock for ${item.medicineName} batch ${item.batchNumber}`,
          },
          { status: 400 }
        );
      }

      batch.quantity -= item.quantity;
      medicine.quantity = medicine.batches.reduce((s, b) => s + b.quantity, 0);
      await medicine.save();
    }

    // Generate order number before creation (pre-save hook runs after validation)
    const today = new Date();
    const prefix = `ORD${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    const count = await Order.countDocuments();
    const orderNumber = `${prefix}${String(count + 1).padStart(4, "0")}`;

    const order = await Order.create({
      orderNumber,
      type: "pos",
      customerName,
      customerPhone,
      items,
      subtotal,
      totalDiscount,
      totalGst,
      totalAmount,
      paymentMethod,
      paymentStatus: "paid",
      status: "completed",
    });

    return NextResponse.json(
      { success: true, message: "Bill generated successfully", data: order },
      { status: 201 }
    );
  } catch (error) {
    console.error("POS order error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
