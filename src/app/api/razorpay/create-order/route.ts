import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import jwt from "jsonwebtoken";
import {
  getRazorpayKeyId,
  getRazorpayKeySecret,
  getJwtSecret,
} from "@/shared/hooks/servenEnv";

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

    const body = (await req.json()) as { amount: number; currency?: string };
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const razorpay = new Razorpay({
      key_id: getRazorpayKeyId(),
      key_secret: getRazorpayKeySecret(),
    });

    const order = await razorpay.orders.create({
      amount: Math.round(body.amount * 100), // paise
      currency: body.currency ?? "INR",
      receipt: `receipt_${Date.now()}`,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: getRazorpayKeyId(),
    });
  } catch (err) {
    console.error("Razorpay create-order error:", err);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
