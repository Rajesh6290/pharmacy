import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/shared/config/db";
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
    if (decoded.role !== "admin") return null;
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

    const { searchParams } = new URL(req.url);
    const days = Math.min(
      90,
      Math.max(7, Number(searchParams.get("days") ?? "30"))
    );

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Daily revenue aggregation
    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Order type breakdown
    const typeBreakdown = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    // Top sold medicines by quantity
    const topMedicines = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: "cancelled" },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.medicineName",
          totalQty: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.total" },
        },
      },
      { $sort: { totalQty: -1 } },
      { $limit: 10 },
    ]);

    // Payment method breakdown
    const paymentBreakdown = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          amount: { $sum: "$totalAmount" },
        },
      },
    ]);

    // Summary totals
    const summary = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
          totalGst: { $sum: "$totalGst" },
          avgOrderValue: { $avg: "$totalAmount" },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        days,
        summary: summary[0] ?? {
          totalRevenue: 0,
          totalOrders: 0,
          totalGst: 0,
          avgOrderValue: 0,
        },
        dailyRevenue,
        typeBreakdown,
        topMedicines,
        paymentBreakdown,
      },
    });
  } catch (err) {
    console.error("GET analytics/sales error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
