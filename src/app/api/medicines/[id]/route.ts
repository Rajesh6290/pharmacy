import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid ID" },
        { status: 400 }
      );
    }
    await connectDB();
    const medicine = await Medicine.findById(id).lean();
    if (!medicine) {
      return NextResponse.json(
        { success: false, message: "Medicine not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: medicine });
  } catch (error) {
    console.error("GET medicine error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = requireAdmin(req);
  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid ID" },
        { status: 400 }
      );
    }
    await connectDB();
    const body = await req.json();
    const allowed = [
      "name",
      "genericName",
      "category",
      "manufacturer",
      "description",
      "unit",
      "requiresPrescription",
      "lowStockThreshold",
      "photo",
      "isActive",
    ];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const medicine = await Medicine.findByIdAndUpdate(id, updates, {
      new: true,
    });
    if (!medicine) {
      return NextResponse.json(
        { success: false, message: "Medicine not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: "Medicine updated",
      data: medicine,
    });
  } catch (error) {
    console.error("PATCH medicine error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = requireAdmin(req);
  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid ID" },
        { status: 400 }
      );
    }
    await connectDB();
    await Medicine.findByIdAndUpdate(id, { isActive: false });
    return NextResponse.json({
      success: true,
      message: "Medicine deactivated",
    });
  } catch (error) {
    console.error("DELETE medicine error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
