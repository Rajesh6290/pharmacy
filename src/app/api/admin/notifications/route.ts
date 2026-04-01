import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/shared/config/db";
import Medicine from "@/shared/core/models/Medicine";
import Order from "@/shared/core/models/Order";
import { getJwtSecret } from "@/shared/hooks/servenEnv";

interface JwtPayload {
  id: string;
  role: string;
}

function requireAdmin(req: NextRequest): JwtPayload | null {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    if (decoded.role !== "admin" && decoded.role !== "pharmacist") return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const admin = requireAdmin(req);
  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    await connectDB();

    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    // 1. Expiry alerts — batches with stock > 0 expiring within 30 days (or already expired)
    const medicines = await Medicine.find({ isActive: true })
      .select("batches")
      .lean();

    let expiryCount = 0;
    for (const m of medicines) {
      for (const batch of m.batches) {
        if (
          batch.quantity > 0 &&
          new Date(batch.expiryDate) <= thirtyDaysFromNow
        ) {
          expiryCount++;
        }
      }
    }

    // 2. Low stock alerts
    const lowStockCount = await Medicine.countDocuments({
      isActive: true,
      $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
    });

    // 3. New online orders (status: pending)
    const newOrdersCount = await Order.countDocuments({ status: "pending" });

    // 4. Prescription uploads pending review
    const prescriptionCount = await Order.countDocuments({
      prescriptionStatus: "pending",
      prescriptionUrl: { $exists: true, $ne: null },
    });

    const total =
      expiryCount + lowStockCount + newOrdersCount + prescriptionCount;

    return NextResponse.json({
      success: true,
      data: {
        expiry: expiryCount,
        lowStock: lowStockCount,
        newOrders: newOrdersCount,
        prescriptions: prescriptionCount,
        total,
      },
    });
  } catch (err) {
    console.error("GET admin/notifications error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
