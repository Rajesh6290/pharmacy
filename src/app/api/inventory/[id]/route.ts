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
    if (decoded.role !== "admin" && decoded.role !== "pharmacist") return null;
    return decoded;
  } catch {
    return null;
  }
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/inventory/[id] - update a batch
// body: { medicineId, batchNumber, quantity?, sellingPrice?, purchasePrice?, expiryDate? }
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const admin = requireAdmin(req);
  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const { id: batchId } = await params;
    const body = await req.json();

    const { medicineId, ...batchUpdates } = body as {
      medicineId: string;
      quantity?: number;
      sellingPrice?: number;
      purchasePrice?: number;
      expiryDate?: string;
    };

    if (!medicineId) {
      return NextResponse.json(
        { success: false, message: "medicineId is required" },
        { status: 400 }
      );
    }

    const updateFields: Record<string, unknown> = {};
    if (batchUpdates.quantity !== undefined) {
      updateFields["batches.$.quantity"] = Number(batchUpdates.quantity);
    }
    if (batchUpdates.sellingPrice !== undefined) {
      updateFields["batches.$.sellingPrice"] = Number(
        batchUpdates.sellingPrice
      );
    }
    if (batchUpdates.purchasePrice !== undefined) {
      updateFields["batches.$.purchasePrice"] = Number(
        batchUpdates.purchasePrice
      );
    }
    if (batchUpdates.expiryDate !== undefined) {
      updateFields["batches.$.expiryDate"] = new Date(batchUpdates.expiryDate);
    }

    const medicine = await Medicine.findOneAndUpdate(
      { _id: medicineId, "batches.batchNumber": batchId },
      { $set: updateFields },
      { new: true }
    );

    if (!medicine) {
      return NextResponse.json(
        { success: false, message: "Medicine or batch not found" },
        { status: 404 }
      );
    }

    // Recalculate total stock quantity
    const totalQty = medicine.batches.reduce(
      (sum: number, b: { quantity: number }) => sum + b.quantity,
      0
    );
    await Medicine.findByIdAndUpdate(medicineId, { quantity: totalQty });

    return NextResponse.json({ success: true, data: medicine });
  } catch (err) {
    console.error("PATCH /api/inventory/[id] error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/[id] - remove a batch
// query: ?medicineId=xxx
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const admin = requireAdmin(req);
  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const { id: batchNumber } = await params;
    const { searchParams } = new URL(req.url);
    const medicineId = searchParams.get("medicineId");

    if (!medicineId) {
      return NextResponse.json(
        { success: false, message: "medicineId query param required" },
        { status: 400 }
      );
    }

    const medicine = await Medicine.findByIdAndUpdate(
      medicineId,
      { $pull: { batches: { batchNumber } } },
      { new: true }
    );

    if (!medicine) {
      return NextResponse.json(
        { success: false, message: "Medicine not found" },
        { status: 404 }
      );
    }

    const totalQty = medicine.batches.reduce(
      (sum: number, b: { quantity: number }) => sum + b.quantity,
      0
    );
    await Medicine.findByIdAndUpdate(medicineId, { quantity: totalQty });

    return NextResponse.json({ success: true, message: "Batch removed" });
  } catch (err) {
    console.error("DELETE /api/inventory/[id] error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
