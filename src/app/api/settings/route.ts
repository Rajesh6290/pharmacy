import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/shared/config/db";
import Settings from "@/shared/core/models/Settings";
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

// GET /api/settings — returns singleton settings (staff only)
export async function GET(req: NextRequest) {
  const staff = requireStaff(req);
  if (!staff) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    // upsert singleton
    let settings = await Settings.findOne().lean();
    if (!settings) {
      settings = await Settings.create({});
    }
    return NextResponse.json({ success: true, data: settings });
  } catch (err) {
    console.error("GET /api/settings error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/settings — admin only
export async function PATCH(req: NextRequest) {
  const staff = requireStaff(req);
  if (!staff) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  // Only admin can update settings
  try {
    const decoded = jwt.verify(
      req.cookies.get("token")!.value,
      getJwtSecret()
    ) as JwtPayload;
    if (decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin only" },
        { status: 403 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const body = await req.json();

    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: body },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: settings });
  } catch (err) {
    console.error("PATCH /api/settings error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
