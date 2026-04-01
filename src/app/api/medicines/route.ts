import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
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

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20"))
    );
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { isActive: true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { genericName: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { "batches.batchNumber": { $regex: search, $options: "i" } },
      ];
    }
    if (category) filter.category = category;

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
    console.error("GET medicines error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

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
      name,
      genericName,
      category,
      manufacturer,
      sku,
      unit,
      requiresPrescription,
      description,
      lowStockThreshold,
      photo,
      firstBatch,
    } = body;

    if (!name || !category || !manufacturer || !sku || !unit) {
      return NextResponse.json(
        {
          success: false,
          message: "name, category, manufacturer, sku and unit are required",
        },
        { status: 400 }
      );
    }

    const existing = await Medicine.findOne({ sku: sku.toUpperCase().trim() });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "A medicine with this SKU already exists" },
        { status: 409 }
      );
    }

    const batches =
      firstBatch &&
      firstBatch.batchNumber &&
      firstBatch.expiryDate &&
      firstBatch.sellingPrice != null &&
      firstBatch.quantity > 0
        ? [
            {
              batchNumber: firstBatch.batchNumber.trim(),
              expiryDate: new Date(firstBatch.expiryDate),
              purchasePrice: Number(firstBatch.purchasePrice ?? 0),
              sellingPrice: Number(firstBatch.sellingPrice),
              gst: Number(firstBatch.gst ?? 0),
              quantity: Number(firstBatch.quantity),
            },
          ]
        : [];

    const totalQuantity = batches.reduce((s, b) => s + b.quantity, 0);

    const medicine = await Medicine.create({
      name: name.trim(),
      genericName: genericName?.trim(),
      category: category.trim(),
      manufacturer: manufacturer.trim(),
      sku: sku.toUpperCase().trim(),
      unit: unit.trim(),
      requiresPrescription: requiresPrescription ?? false,
      description: description?.trim(),
      lowStockThreshold: lowStockThreshold ?? 10,
      photo,
      batches,
      quantity: totalQuantity,
    });

    return NextResponse.json(
      { success: true, message: "Medicine created", data: medicine },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST medicine error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
