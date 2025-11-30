import { NextRequest, NextResponse } from "next/server";

// This should match the store in whatsapp-otp route
// In production, use Redis or database
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp } = await request.json();

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: "Phone number and OTP are required" },
        { status: 400 }
      );
    }

    // Get stored OTP
    const storedData = otpStore.get(phoneNumber);

    if (!storedData) {
      return NextResponse.json(
        { error: "OTP not found or expired" },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(phoneNumber);
      return NextResponse.json(
        { error: "OTP has expired" },
        { status: 400 }
      );
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 400 }
      );
    }

    // OTP is valid, remove it
    otpStore.delete(phoneNumber);

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Error verifying WhatsApp OTP:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
