import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/shared/config/db";
import Order from "@/shared/core/models/Order";
import { getJwtSecret } from "@/shared/hooks/servenEnv";

interface JwtPayload {
  id: string;
  role: string;
}

function requireStaff(req: NextRequest): JwtPayload | null {
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const staff = requireStaff(req);
  if (!staff) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const { id } = await params;
    const order = await Order.findById(id).lean();

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (err) {
    console.error("GET /api/orders/[id]/invoice error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
