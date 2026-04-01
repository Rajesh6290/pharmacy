import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { getRazorpayKeySecret, getJwtSecret } from "@/shared/hooks/servenEnv";

interface JwtPayload {
  id: string;
  role: string;
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    jwt.verify(token, getJwtSecret()) as JwtPayload;

    const body = (await req.json()) as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    };

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment payload" },
        { status: 400 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", getRazorpayKeySecret())
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Payment verification failed — signature mismatch" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, paymentId: razorpay_payment_id });
  } catch (err) {
    console.error("Razorpay verify error:", err);
    return NextResponse.json(
      { error: "Payment verification error" },
      { status: 500 }
    );
  }
}
