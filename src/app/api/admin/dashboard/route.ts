import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/shared/config/db";
import Medicine from "@/shared/core/models/Medicine";
import Order from "@/shared/core/models/Order";
import User from "@/shared/core/models/User";
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
    if (decoded.role !== "admin" && decoded.role !== "pharmacist") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalMedicines,
      totalUsers,
      todayOrders,
      monthOrders,
      lowStockCount,
      expiryAlertCount,
    ] = await Promise.all([
      Medicine.countDocuments(),
      User.countDocuments({ role: "customer" }),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.find({
        createdAt: { $gte: thirtyDaysAgo },
        status: { $ne: "cancelled" },
      }).select("totalAmount"),
      Medicine.countDocuments({ quantity: { $lte: 10, $gt: 0 } }),
      Medicine.countDocuments({
        "batches.expiryDate": {
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          $gte: new Date(),
        },
        "batches.quantity": { $gt: 0 },
      }),
    ]);

    const monthRevenue = monthOrders.reduce(
      (sum: number, o: { totalAmount?: number }) => sum + (o.totalAmount ?? 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        totalMedicines,
        totalUsers,
        todayOrders,
        monthRevenue,
        lowStockCount,
        expiryAlertCount,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
