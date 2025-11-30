import { jsPDF } from "jspdf";

interface InvoiceData {
  paymentId: string;
  orderId: string;
  amount: number;
  planName: string;
  userId: string;
  date: string;
}

export async function generateInvoicePDF(
  invoiceData: InvoiceData
): Promise<Buffer> {
  try {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    // Add content to PDF
    doc.setFontSize(20);
    const titleWidth = doc.getTextWidth("Invoice");
    const pageWidth = doc.internal.pageSize.width;
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text("Invoice", titleX, 30);

    doc.setFontSize(12);
    let y = 60;

    // Add invoice details
    doc.text(`Payment ID: ${invoiceData.paymentId}`, 20, y);
    y += 15;

    doc.text(`Order ID: ${invoiceData.orderId}`, 20, y);
    y += 15;

    doc.text(`Plan: ${invoiceData.planName}`, 20, y);
    y += 15;

    doc.text(`Amount: ₹${(invoiceData.amount / 100).toFixed(2)}`, 20, y);
    y += 15;

    // Handle date safely
    let dateStr = "N/A";
    try {
      const date = new Date(invoiceData.date);
      if (!isNaN(date.getTime())) {
        dateStr = date.toLocaleDateString('en-IN');
      }
    } catch (dateError) {
      console.error("Date parsing error:", dateError);
    }
    doc.text(`Date: ${dateStr}`, 20, y);
    y += 15;

    doc.text(`User ID: ${invoiceData.userId}`, 20, y);

    // Get PDF as buffer
    const arrayBuffer = doc.output("arraybuffer");
    const pdfBuffer = Buffer.from(arrayBuffer);

    if (pdfBuffer.length === 0) {
      throw new Error("Generated PDF buffer is empty");
    }

    console.log("PDF generated successfully, buffer length:", pdfBuffer.length);
    console.log("Invoice data:", invoiceData);

    return pdfBuffer;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error(`PDF generation failed: ${(error as any).message}`);
  }
}

export async function uploadInvoiceToSupabase(
  pdfBuffer: Buffer,
  fileName: string
): Promise<string> {
  const { getSupabaseAdmin } = await import("@/lib/api/supabase-admin");
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.storage
    .from("invoices")
    .upload(fileName, pdfBuffer, {
      contentType: "application/pdf",
    });

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from("invoices")
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}
