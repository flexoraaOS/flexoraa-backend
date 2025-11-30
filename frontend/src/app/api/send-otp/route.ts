import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Check if environment variables are set
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPassword) {
      console.error("Missing Gmail credentials:", {
        hasUser: !!gmailUser,
        hasPassword: !!gmailPassword,
      });
      return NextResponse.json(
        {
          error:
            "Gmail SMTP not configured. Please check your environment variables.",
          details: "Missing GMAIL_USER or GMAIL_APP_PASSWORD",
        },
        { status: 500 }
      );
    }

    // Create transporter with detailed configuration
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
      debug: true, // Enable debug mode
      logger: true, // Log to console
    });

    // Verify connection
    try {
      await transporter.verify();
      console.log("Gmail SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("Gmail SMTP verification failed:", verifyError);
      return NextResponse.json(
        {
          error: "Gmail SMTP connection failed. Please check your credentials.",
          details:
            verifyError instanceof Error
              ? verifyError.message
              : "Unknown error",
        },
        { status: 500 }
      );
    }

    // Send email with OTP using Gmail SMTP
    const mailOptions = {
      from: `"Flexoraa" <${gmailUser}>`,
      to: email,
      subject: "Password Reset Code - Flexoraa",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ec4343;">Password Reset Code</h2>
          <p>Hello,</p>
          <p>You have requested to reset your password for your Flexoraa account.</p>
          <p>Your 6-digit reset code is:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #ec4343; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes for security reasons.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>The Flexoraa Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      {
        error: "Failed to send email. Please check your Gmail configuration.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
