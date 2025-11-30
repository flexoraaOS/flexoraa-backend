import { NextRequest, NextResponse } from "next/server";
import { qrSessions } from "@/lib/qr-session-store";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("session");
    const token = request.nextUrl.searchParams.get("token");

    if (!sessionId || !token) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invalid Link</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui; padding: 20px; text-align: center; }
              .error { color: #dc2626; }
            </style>
          </head>
          <body>
            <h1 class="error">❌ Invalid Verification Link</h1>
            <p>This link is invalid or has expired.</p>
          </body>
        </html>
        `,
        { 
          status: 400,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    // Get session
    const session = qrSessions.get(sessionId);

    if (!session) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Session Not Found</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui; padding: 20px; text-align: center; }
              .error { color: #dc2626; }
            </style>
          </head>
          <body>
            <h1 class="error">❌ Session Not Found</h1>
            <p>This session has expired or doesn't exist.</p>
            <p>Please generate a new QR code.</p>
          </body>
        </html>
        `,
        { 
          status: 404,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    // Check if expired
    if (Date.now() > session.expiresAt) {
      qrSessions.delete(sessionId);
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Session Expired</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui; padding: 20px; text-align: center; }
              .error { color: #dc2626; }
            </style>
          </head>
          <body>
            <h1 class="error">⏰ Session Expired</h1>
            <p>This verification link has expired.</p>
            <p>Please generate a new QR code.</p>
          </body>
        </html>
        `,
        { 
          status: 400,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    // Verify token
    const shortToken = session.token.substring(0, 8);
    if (token !== shortToken) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invalid Token</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui; padding: 20px; text-align: center; }
              .error { color: #dc2626; }
            </style>
          </head>
          <body>
            <h1 class="error">❌ Invalid Token</h1>
            <p>The verification token is incorrect.</p>
          </body>
        </html>
        `,
        { 
          status: 400,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    // Mark session as verified
    session.verified = true;
    qrSessions.set(sessionId, session);

    // Return success page
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Login Verified</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui; 
              padding: 20px; 
              text-align: center;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              max-width: 400px;
            }
            .success { 
              color: #16a34a; 
              font-size: 48px;
              margin: 0;
            }
            h1 {
              color: #1f2937;
              margin: 20px 0;
            }
            p {
              color: #6b7280;
              line-height: 1.6;
            }
            .checkmark {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              display: block;
              stroke-width: 3;
              stroke: #16a34a;
              stroke-miterlimit: 10;
              margin: 20px auto;
              box-shadow: inset 0px 0px 0px #16a34a;
              animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
            }
            .checkmark__circle {
              stroke-dasharray: 166;
              stroke-dashoffset: 166;
              stroke-width: 3;
              stroke-miterlimit: 10;
              stroke: #16a34a;
              fill: none;
              animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
            }
            .checkmark__check {
              transform-origin: 50% 50%;
              stroke-dasharray: 48;
              stroke-dashoffset: 48;
              animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
            }
            @keyframes stroke {
              100% { stroke-dashoffset: 0; }
            }
            @keyframes scale {
              0%, 100% { transform: none; }
              50% { transform: scale3d(1.1, 1.1, 1); }
            }
            @keyframes fill {
              100% { box-shadow: inset 0px 0px 0px 30px #16a34a; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            <h1>✅ Login Verified!</h1>
            <p>Your login has been verified successfully.</p>
            <p><strong>You can now close this window and return to the app.</strong></p>
            <p style="margin-top: 30px; font-size: 14px; color: #9ca3af;">
              The app will automatically log you in.
            </p>
          </div>
        </body>
      </html>
      `,
      { 
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  } catch (error) {
    console.error("Error verifying link:", error);
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui; padding: 20px; text-align: center; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1 class="error">❌ Error</h1>
          <p>An error occurred while verifying your login.</p>
        </body>
      </html>
      `,
      { 
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}
