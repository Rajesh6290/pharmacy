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

// GET /api/inventory - list all medicines with their batches
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
    const search = searchParams.get("search") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20"))
    );
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    const [medicines, total] = await Promise.all([
      Medicine.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Medicine.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        medicines,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("GET inventory error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/inventory - add a batch to a medicine
export async function POST(req: NextRequest) {
  const admin = requireAdmin(req);
  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }
  try {
    await connectDB();
    const body = await req.json();
    const {
      medicineId,
      batchNumber,
      expiryDate,
      purchasePrice,
      sellingPrice,
      gst,
      quantity,
    } = body;

    if (
      !medicineId ||
      !batchNumber ||
      !expiryDate ||
      purchasePrice === undefined ||
      sellingPrice === undefined ||
      gst === undefined ||
      quantity === undefined
    ) {
      return NextResponse.json(
        { success: false, message: "All batch fields are required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(medicineId)) {
      return NextResponse.json(
        { success: false, message: "Invalid medicine ID" },
        { status: 400 }
      );
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return NextResponse.json(
        { success: false, message: "Medicine not found" },
        { status: 404 }
      );
    }

    const existingBatch = medicine.batches.find(
      (b) => b.batchNumber === batchNumber
    );
    if (existingBatch) {
      existingBatch.quantity += Number(quantity);
      existingBatch.sellingPrice = Number(sellingPrice);
    } else {
      medicine.batches.push({
        batchNumber: batchNumber.trim(),
        expiryDate: new Date(expiryDate),
        purchasePrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice),
        gst: Number(gst),
        quantity: Number(quantity),
      });
    }

    medicine.quantity = medicine.batches.reduce(
      (sum, b) => sum + b.quantity,
      0
    );
    await medicine.save();

    return NextResponse.json({
      success: true,
      message: "Batch added successfully",
      data: medicine,
    });
  } catch (error) {
    console.error("POST inventory error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
