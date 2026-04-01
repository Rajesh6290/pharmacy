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

// GET /api/inventory/alerts/low-stock — medicines at or below threshold
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

    const medicines = await Medicine.find({
      isActive: true,
      $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
    })
      .sort({ quantity: 1 })
      .lean();

    const results = medicines.map((m) => ({
      id: m._id.toString(),
      name: m.name,
      sku: m.sku,
      quantity: m.quantity,
      threshold: m.lowStockThreshold,
    }));

    return NextResponse.json({
      success: true,
      data: { lowStock: results, total: results.length },
    });
  } catch (err) {
    console.error("GET inventory/alerts/low-stock error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
