import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { qrSessions } from "@/lib/qr-session-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Generate unique session ID and verification token
    const sessionId = randomBytes(16).toString("hex");
    const token = randomBytes(32).toString("hex");
    const shortToken = token.substring(0, 8);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store session with the user's phone number
    qrSessions.set(sessionId, {
      token,
      phoneNumber, // Store the user's phone for verification
      verified: false,
      expiresAt,
      createdAt: Date.now(),
    });

    // Get the business WhatsApp number from env
    const businessWhatsAppNumber = process.env.META_WHATSAPP_BUSINESS_NUMBER || process.env.META_WHATSAPP_PHONE_NUMBER_ID;
    
    if (!businessWhatsAppNumber || businessWhatsAppNumber === '1234567890') {
      console.error("META_WHATSAPP_BUSINESS_NUMBER not configured properly");
      return NextResponse.json(
        { 
          error: "WhatsApp Business number not configured. Please contact support.",
          details: "Administrator needs to set META_WHATSAPP_BUSINESS_NUMBER in environment variables"
        },
        { status: 503 }
      );
    }
    
    // Create a WhatsApp message link with pre-filled verification message
    // Format: https://wa.me/PHONE_NUMBER?text=MESSAGE
    const verificationMessage = `Verify login: ${shortToken}`;
    const encodedMessage = encodeURIComponent(verificationMessage);
    
    // WhatsApp link that opens chat with pre-filled message
    const whatsappLink = `https://wa.me/${businessWhatsAppNumber}?text=${encodedMessage}`;
    
    // Also create a web verification URL as fallback
    const webVerificationUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/whatsapp-qr/verify-link?session=${sessionId}&token=${shortToken}`;
    
    // QR code will contain the WhatsApp link
    const qrData = whatsappLink;
    
    console.log(`Generated QR for session ${sessionId}, WhatsApp link: ${whatsappLink}`);

    return NextResponse.json({
      success: true,
      sessionId,
      qrData,
      whatsappLink,
      verificationUrl: webVerificationUrl,
      shortToken,
      expiresAt,
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
