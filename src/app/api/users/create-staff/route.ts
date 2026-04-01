import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/shared/config/db";
import User from "@/shared/core/models/User";
import { getJwtSecret } from "@/shared/hooks/servenEnv";

interface JwtPayload {
  id: string;
  role: string;
}

// POST /api/users/create-staff — admin only, creates pharmacist or admin accounts
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    if (decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden — admin only" },
        { status: 403 }
      );
    }

    const { name, email, phone, password, role } = await req.json();

    if (!name || !email || !phone || !password || !role) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    if (!["pharmacist", "admin"].includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid role" },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists",
        },
        { status: 409 }
      );
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,
      role,
    });

    return NextResponse.json(
      {
        success: true,
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create staff error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
