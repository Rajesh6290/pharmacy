import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/shared/config/db";
import User from "@/shared/core/models/User";
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
    if (decoded.role !== "admin") return null;
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
    const user = await User.findById(id).select("-password").lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: user });
  } catch (err) {
    console.error("GET /api/users/[id] error:", err);
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

    // Only allow updating role and isActive from admin panel
    const allowed: Record<string, unknown> = {};
    if (
      body.role !== undefined &&
      ["customer", "admin", "pharmacist"].includes(body.role)
    ) {
      allowed.role = body.role;
    }
    if (body.isActive !== undefined) {
      allowed.isActive = Boolean(body.isActive);
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: allowed },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (err) {
    console.error("PATCH /api/users/[id] error:", err);
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
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error("DELETE /api/users/[id] error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
