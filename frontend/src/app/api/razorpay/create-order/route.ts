import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { nanoid } from "nanoid";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Check for environment variables at the start to fail fast if they are missing.
if (
  !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
  !process.env.RAZORPAY_KEY_SECRET
) {
  console.error(
    "CRITICAL: Razorpay API keys are not configured. Please check your .env.local file."
  );
}

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { amount, planName, userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: User ID missing" },
        { status: 401 }
      );
    }

    if (amount === undefined || typeof amount !== "number") {
      return NextResponse.json(
        { error: "Amount is required and must be a number." },
        { status: 400 }
      );
    }

    if (amount < 100) {
      return NextResponse.json(
        { error: "Amount must be at least ₹1." },
        { status: 400 }
      );
    }

    const options = {
      amount: amount,
      currency: "INR",
      receipt: `receipt_order_${nanoid(10)}`,
      notes: {
        user_id: userId,
        plan_name: planName || "Unknown Plan",
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({ order }, { status: 200 });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);

    return NextResponse.json(
      {
        error:
          error.message || "Something went wrong while creating the order.",
      },
      { status: 500 }
    );
  }
}
