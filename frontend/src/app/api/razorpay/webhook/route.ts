import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/api/supabase-admin";
import {
  generateInvoicePDF,
  uploadInvoiceToSupabase,
} from "../../../../lib/generateInvoice";

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();

  try {
    const body = await req.text();
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const signature = req.headers.get("x-razorpay-signature") || "";

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      // Insert payment record
      const { error: paymentError } = await supabase.from("payments").insert({
        user_id: payment.notes.user_id,
        order_id: payment.order_id,
        payment_id: payment.id,
        signature: signature,
        amount: payment.amount,
        status: "success",
      });

      if (paymentError) {
        console.error("Error inserting payment record:", paymentError);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      // Insert subscription record
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 30);

      const { error: subError } = await supabase.from("subscriptions").insert({
        user_id: payment.notes.user_id,
        plan_name: payment.notes.plan_name || "Unknown Plan",
        status: "active",
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        razorpay_payment_id: payment.id,
        razorpay_order_id: payment.order_id,
      });

      if (subError) {
        console.error("Error inserting subscription record:", subError);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      // Generate and upload invoice PDF
      const invoiceData = {
        paymentId: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        planName: payment.notes.plan_name || "Unknown Plan",
        userId: String(payment.notes.user_id),
        date: new Date().toISOString(),
      };

      console.log("Generating invoice PDF for webhook");
      const pdfBuffer = await generateInvoicePDF(invoiceData);
      const fileName = `invoice_${payment.id}.pdf`;
      const invoiceUrl = await uploadInvoiceToSupabase(pdfBuffer, fileName);

      console.log("Updating payment record with invoice URL");
      const { error: updateError } = await supabase
        .from("payments")
        .update({ invoice_url: invoiceUrl })
        .eq("payment_id", payment.id);

      if (updateError) {
        console.error("Payment update error:", updateError);
        // Don't return error, as payment is already processed
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "Event ignored" });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
