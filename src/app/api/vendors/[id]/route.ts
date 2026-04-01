import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/shared/config/db";
import Vendor from "@/shared/core/models/Vendor";
import { getJwtSecret } from "@/shared/hooks/servenEnv";

interface JwtPayload {
  id: string;
  role: string;
}

function adminGuard(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
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
  const admin = adminGuard(req);
  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const { id } = await params;
    const vendor = await Vendor.findById(id).lean();
    if (!vendor) {
      return NextResponse.json(
        { success: false, message: "Vendor not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: vendor });
  } catch (err) {
    console.error("GET /api/vendors/[id] error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const admin = adminGuard(req);
  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const vendor = await Vendor.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!vendor) {
      return NextResponse.json(
        { success: false, message: "Vendor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: vendor });
  } catch (err) {
    console.error("PATCH /api/vendors/[id] error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const admin = adminGuard(req);
  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const { id } = await params;
    const vendor = await Vendor.findByIdAndDelete(id);
    if (!vendor) {
      return NextResponse.json(
        { success: false, message: "Vendor not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Vendor deleted" });
  } catch (err) {
    console.error("DELETE /api/vendors/[id] error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
