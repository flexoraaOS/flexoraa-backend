import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/api/supabase-admin";
import crypto from "crypto";
import Razorpay from "razorpay";
import {
  generateInvoicePDF,
  uploadInvoiceToSupabase,
} from "@/lib/generateInvoice";
import { sendInvoiceEmail } from "@/lib/email";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  console.log("Verify-payment API called");
  const supabase = getSupabaseAdmin();

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planName, // e.g., 'Pro Plan'
      amount, // in paisa
    } = await req.json();

    console.log("Received data:", {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planName,
      amount,
    });

    // 1. Fetch order from Razorpay to get user_id from notes
    const order = await razorpay.orders.fetch(razorpay_order_id);
    console.log("Fetched order:", order);
    const userId = order.notes?.user_id;
    if (!userId) {
      console.error("User ID not found in order notes");
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }
    console.log("User ID from order notes:", userId);

    // 2. Verify the signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    console.log("Expected signature:", expectedSignature);
    console.log("Received signature:", razorpay_signature);

    if (expectedSignature !== razorpay_signature) {
      console.error("Signature mismatch, logging failed payment");
      // If signature doesn't match, log the failed payment and return an error
      await supabase.from("payments").insert({
        user_id: userId,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        signature: razorpay_signature,
        amount: amount,
        status: "failed",
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("Signature verified successfully");

    // 3. Signature is valid, update the database
    const startDate = new Date();
    // Assuming a 30-day subscription for this example
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 30);

    console.log("Inserting into subscriptions table");
    // Insert into subscriptions table
    const { error: subError } = await supabase.from("subscriptions").insert({
      user_id: userId,
      plan_name: planName,
      status: "active",
      current_period_start: startDate.toISOString(),
      current_period_end: endDate.toISOString(),
      razorpay_payment_id: razorpay_payment_id,
      razorpay_order_id: razorpay_order_id,
    });

    if (subError) {
      console.error("Subscription insert error:", subError);
      throw subError;
    }
    console.log("Subscription inserted successfully");

    console.log("Inserting into payments table");
    // Log the successful payment
    const { error: payError } = await supabase.from("payments").insert({
      user_id: userId,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature,
      amount: amount,
      status: "success",
    });

    if (payError) {
      console.error("Payment insert error:", payError);
      throw payError;
    }
    console.log("Payment logged successfully");

    // 4. Generate and upload invoice PDF
    const invoiceData = {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount: amount,
      planName: planName,
      userId: String(userId),
      date: new Date().toISOString(),
    };

    console.log("Generating invoice PDF");
    const pdfBuffer = await generateInvoicePDF(invoiceData);
    const fileName = `invoice_${razorpay_payment_id}.pdf`;
    const invoiceUrl = await uploadInvoiceToSupabase(pdfBuffer, fileName);

    console.log("Updating payment record with invoice URL");
    const { error: updateError } = await supabase
      .from("payments")
      .update({ invoice_url: invoiceUrl })
      .eq("payment_id", razorpay_payment_id);

    if (updateError) {
      console.error("Payment update error:", updateError);
      // Don't throw, as payment is already successful
    }

    // 5. Send invoice email
    try {
      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserById(String(userId));
      if (userError || !userData?.user?.email) {
        console.error("Error fetching user email:", userError);
      } else {
        console.log("Sending invoice email to:", userData.user.email);
        await sendInvoiceEmail(
          userData.user.email,
          pdfBuffer,
          razorpay_payment_id,
          amount,
          planName
        );
        console.log("Invoice email sent successfully");
      }
    } catch (emailError) {
      console.error("Error sending invoice email:", emailError);
      // Don't throw, as payment is successful
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment verified and subscription activated.",
        invoiceUrl: invoiceUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment verification failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
