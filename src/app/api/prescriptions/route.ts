import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/shared/config/db";
import Prescription from "@/shared/core/models/Prescription";
import { getJwtSecret } from "@/shared/hooks/servenEnv";

interface JwtPayload {
  id: string;
  role: string;
}

// ─── Security helpers ────────────────────────────────────────────────────────

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

// In-memory rate limiter: max 5 submissions per IP per 15 minutes
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** Strip HTML tags and limit string length */
function sanitiseText(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "") // strip any HTML tags
    .replace(/[<>'"]/g, "") // strip remaining dangerous chars
    .trim()
    .slice(0, maxLen);
}

/** Accept only Cloudinary HTTPS URLs from our upload service */
function isValidCloudinaryUrl(url: unknown): boolean {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" && parsed.hostname.endsWith("cloudinary.com")
    );
  } catch {
    return false;
  }
}

/** Validate Cloudinary public_id — letters, digits, underscores, hyphens, slashes only */
function isValidPublicId(id: unknown): boolean {
  if (typeof id !== "string") return false;
  return /^[\w\-/]+$/.test(id) && id.length <= 200;
}

// ─── POST /api/prescriptions — public ────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, message: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": "900" } }
    );
  }

  // Content-type guard
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { success: false, message: "Content-Type must be application/json" },
      { status: 415 }
    );
  }

  try {
    await connectDB();
    const body = await req.json();
    const { name, phone, prescriptionUrl, publicId } = body;

    // Required field presence
    if (!name || !phone || !prescriptionUrl || !publicId) {
      return NextResponse.json(
        {
          success: false,
          message: "name, phone, prescriptionUrl and publicId are required",
        },
        { status: 400 }
      );
    }

    // Sanitise & validate name
    const safeName = sanitiseText(name, 100);
    if (safeName.length < 2) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid full name." },
        { status: 400 }
      );
    }

    // Phone: exactly 10 digits, Indian mobile (starts 6–9)
    const safePhone = sanitiseText(phone, 10);
    if (!/^[6-9]\d{9}$/.test(safePhone)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid 10-digit Indian mobile number.",
        },
        { status: 400 }
      );
    }

    // Validate prescription URL is a real Cloudinary HTTPS URL
    if (!isValidCloudinaryUrl(prescriptionUrl)) {
      return NextResponse.json(
        { success: false, message: "Invalid prescription image URL." },
        { status: 400 }
      );
    }

    // Validate publicId format
    if (!isValidPublicId(publicId)) {
      return NextResponse.json(
        { success: false, message: "Invalid file reference." },
        { status: 400 }
      );
    }

    const prescription = await Prescription.create({
      name: safeName,
      phone: safePhone,
      prescriptionUrl,
      publicId,
      status: "pending",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Prescription submitted successfully",
        data: { _id: prescription._id },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST prescription error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── GET /api/prescriptions — admin only ─────────────────────────────────────
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
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (status && ["pending", "reviewed", "called"].includes(status)) {
      filter.status = status;
    }

    const [prescriptions, total] = await Promise.all([
      Prescription.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Prescription.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: { prescriptions, total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET prescriptions error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
