import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/config/db";
import User from "@/shared/core/models/User";

/**
 * POST /api/auth/seed-admin
 * Creates the first admin user ONLY if no admin exists yet.
 * Body: { name, email, phone, password, secret }
 * The `secret` must match ADMIN_SEED_SECRET in .env to prevent abuse.
 */
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.ADMIN_SEED_SECRET;
    if (!secret) {
      return NextResponse.json(
        { success: false, message: "ADMIN_SEED_SECRET not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      phone,
      password,
      secret: provided,
    } = body as {
      name: string;
      email: string;
      phone: string;
      password: string;
      secret: string;
    };

    if (provided !== secret) {
      return NextResponse.json(
        { success: false, message: "Invalid secret" },
        { status: 403 }
      );
    }

    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "name, email, phone and password are required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return NextResponse.json(
        { success: false, message: "An admin account already exists" },
        { status: 409 }
      );
    }

    const admin = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,
      role: "admin",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Admin account created successfully",
        user: {
          id: admin._id.toString(),
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Seed admin error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
