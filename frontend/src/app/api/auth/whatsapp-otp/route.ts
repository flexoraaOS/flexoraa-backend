import { NextRequest, NextResponse } from "next/server";

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP
    otpStore.set(phoneNumber, { otp, expiresAt });

    // Send OTP via WhatsApp using Meta Business API
    const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID;
    const metaAccessToken = process.env.META_ACCESS_TOKEN;
    const whatsappPhoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;

    if (!metaAccessToken || !whatsappPhoneNumberId) {
      console.error("WhatsApp credentials not configured");
      // For development, just return success
      console.log(`OTP for ${phoneNumber}: ${otp}`);
      return NextResponse.json({
        success: true,
        message: "OTP sent successfully",
        // Remove this in production
        devOTP: process.env.NODE_ENV === "development" ? otp : undefined,
      });
    }

    // Send WhatsApp message via Meta API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "template",
          template: {
            name: "otp_verification", // You need to create this template in Meta Business
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: [
                  {
                    type: "text",
                    text: otp,
                  },
                ],
              },
            ],
          },
        }),
      }
    );

    if (!whatsappResponse.ok) {
      const error = await whatsappResponse.json();
      console.error("WhatsApp API error:", error);
      
      // Fallback: Log OTP for development
      console.log(`OTP for ${phoneNumber}: ${otp}`);
      return NextResponse.json({
        success: true,
        message: "OTP sent successfully (fallback mode)",
        devOTP: process.env.NODE_ENV === "development" ? otp : undefined,
      });
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Error sending WhatsApp OTP:", error);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
