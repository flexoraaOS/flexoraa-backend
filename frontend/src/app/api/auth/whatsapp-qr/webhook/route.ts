import { NextRequest, NextResponse } from "next/server";
import { qrSessions } from "@/lib/qr-session-store";

// Webhook verification (GET request from Meta)
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("Webhook verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json(
    { error: "Verification failed" },
    { status: 403 }
  );
}

// Webhook for incoming messages (POST request from Meta)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract message data
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ success: true });
    }

    const message = messages[0];
    const phoneNumber = message.from;
    const messageText = message.text?.body;

    console.log(`Received message from ${phoneNumber}: ${messageText}`);

    // Check if message contains verification token
    if (messageText && messageText.includes("Verify login:")) {
      const tokenMatch = messageText.match(/Verify login:\s*([a-f0-9]{8})/i);
      
      if (tokenMatch) {
        const shortToken = tokenMatch[1];
        
        // Find matching session
        for (const [sessionId, session] of qrSessions.entries()) {
          if (session.token.substring(0, 8) === shortToken && !session.verified) {
            // Verify session
            session.verified = true;
            session.phoneNumber = phoneNumber;
            qrSessions.set(sessionId, session);
            
            console.log(`Session ${sessionId} verified for ${phoneNumber}`);
            
            // Send confirmation message back to user
            await sendWhatsAppMessage(
              phoneNumber,
              "✅ Login verified! You can now close this chat and return to the app."
            );
            
            break;
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Helper function to send WhatsApp message
async function sendWhatsAppMessage(to: string, message: string) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.log("WhatsApp credentials not configured, skipping message send");
    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: message },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to send WhatsApp message:", error);
    }
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
  }
}
