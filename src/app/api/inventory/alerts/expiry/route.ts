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
    if (decoded.role !== "admin" && decoded.role !== "pharmacist") return null;
    return decoded;
  } catch {
    return null;
  }
}

// GET /api/inventory/alerts/expiry — batches near or past expiry
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
    const { searchParams } = new URL(req.url);
    const days = Math.max(1, Number(searchParams.get("days") ?? "30"));

    const now = new Date();
    const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const medicines = await Medicine.find({ isActive: true }).lean();

    const results: {
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
          results.push({
            medicineId: m._id.toString(),
            medicineName: m.name,
            sku: m.sku,
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            quantity: batch.quantity,
            status: "expired",
          });
        } else if (expiry <= threshold) {
          results.push({
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

    results.sort(
      (a, b) =>
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    );

    return NextResponse.json({
      success: true,
      data: { expiryAlerts: results, total: results.length },
    });
  } catch (err) {
    console.error("GET inventory/alerts/expiry error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
