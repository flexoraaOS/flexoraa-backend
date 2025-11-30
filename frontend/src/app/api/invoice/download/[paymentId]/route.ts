import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateInvoicePDF } from "@/lib/generateInvoice";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch payment details
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("payment_id", paymentId)
      .eq("user_id", user.id)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Fetch subscription for plan name
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("plan_name")
      .eq("razorpay_payment_id", paymentId)
      .single();

    const planName = subscription?.plan_name || "Unknown Plan";

    // Prepare invoice data
    const invoiceData = {
      paymentId: payment.payment_id,
      orderId: payment.order_id,
      amount: payment.amount,
      planName,
      userId: payment.user_id,
      date: payment.created_at,
    };

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoiceData);

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${paymentId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
