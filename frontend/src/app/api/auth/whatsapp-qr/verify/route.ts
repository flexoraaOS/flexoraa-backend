import { NextRequest, NextResponse } from "next/server";
import { qrSessions } from "@/lib/qr-session-store";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get session
    const session = qrSessions.get(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found or expired" },
        { status: 404 }
      );
    }

    // Check if expired
    if (Date.now() > session.expiresAt) {
      qrSessions.delete(sessionId);
      return NextResponse.json(
        { error: "Session expired" },
        { status: 400 }
      );
    }

    // If session is verified
    if (session.verified) {
      // Clean up session
      qrSessions.delete(sessionId);
      
      return NextResponse.json({
        success: true,
        verified: true,
        phoneNumber: session.phoneNumber,
      });
    }

    return NextResponse.json({
      success: true,
      verified: false,
      message: "Waiting for verification",
    });
  } catch (error) {
    console.error("Error verifying QR session:", error);
    return NextResponse.json(
      { error: "Failed to verify session" },
      { status: 500 }
    );
  }
}

// Polling endpoint for client to check status
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const session = qrSessions.get(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (Date.now() > session.expiresAt) {
      qrSessions.delete(sessionId);
      return NextResponse.json(
        { error: "Session expired" },
        { status: 400 }
      );
    }

    if (session.verified && session.phoneNumber) {
      return NextResponse.json({
        verified: true,
        phoneNumber: session.phoneNumber,
      });
    }

    return NextResponse.json({
      verified: false,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error("Error checking session status:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
