import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/shared/config/db";
import Medicine from "@/shared/core/models/Medicine";
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
    return decoded.role === "admin" || decoded.role === "pharmacist"
      ? decoded
      : null;
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

    const medicines = await Medicine.find({ isActive: true }).lean();

    const lowStock = medicines.filter((m) => m.quantity <= m.lowStockThreshold);

    const expiredBatches: {
      medicineId: string;
      medicineName: string;
      sku: string;
      batchNumber: string;
      expiryDate: Date;
      quantity: number;
      status: "expired" | "near_expiry";
    }[] = [];

    for (const m of medicines) {
      for (const batch of m.batches) {
        if (batch.quantity <= 0) continue;
        const expiry = new Date(batch.expiryDate);
        if (expiry < now) {
          expiredBatches.push({
            medicineId: m._id.toString(),
            medicineName: m.name,
            sku: m.sku,
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            quantity: batch.quantity,
            status: "expired",
          });
        } else if (expiry <= thirtyDaysFromNow) {
          expiredBatches.push({
            medicineId: m._id.toString(),
            medicineName: m.name,
            sku: m.sku,
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            quantity: batch.quantity,
            status: "near_expiry",
          });
        }
      }
    }

    expiredBatches.sort(
      (a, b) =>
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    );

    return NextResponse.json({
      success: true,
      data: {
        lowStock: lowStock.map((m) => ({
          id: m._id.toString(),
          name: m.name,
          sku: m.sku,
          quantity: m.quantity,
          threshold: m.lowStockThreshold,
        })),
        expiryAlerts: expiredBatches,
      },
    });
  } catch (error) {
    console.error("Alerts error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
