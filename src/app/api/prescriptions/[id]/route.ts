import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/shared/config/db";
import Prescription from "@/shared/core/models/Prescription";
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

const ALLOWED_STATUSES = ["pending", "reviewed", "called"];

// PATCH /api/prescriptions/[id] — update status + notes (admin only)
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
    await connectDB();
    const { id } = await params;

    // Validate MongoDB ObjectId to prevent DB probing
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid prescription ID." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const update: Record<string, unknown> = {};

    // Validate status
    if (body.status !== undefined) {
      if (!ALLOWED_STATUSES.includes(body.status)) {
        return NextResponse.json(
          {
            success: false,
            message: `status must be one of: ${ALLOWED_STATUSES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      update.status = body.status;
    }

    // Sanitise notes — strip HTML, max 1000 chars
    if (body.notes !== undefined) {
      const notes = String(body.notes)
        .replace(/<[^>]*>/g, "")
        .replace(/[<>'"]/g, "")
        .trim()
        .slice(0, 1000);
      update.notes = notes;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields to update." },
        { status: 400 }
      );
    }

    const prescription = await Prescription.findByIdAndUpdate(id, update, {
      new: true,
    });

    if (!prescription) {
      return NextResponse.json(
        { success: false, message: "Prescription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: prescription });
  } catch (error) {
    console.error("PATCH prescription error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
