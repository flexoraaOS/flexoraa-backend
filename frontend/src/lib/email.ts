import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendInvoiceEmail(
  to: string,
  invoiceBuffer: Buffer,
  paymentId: string,
  amount: number,
  planName: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Flexoraa <noreply@flexoraa.com>", // Replace with your verified domain
      to: [to],
      subject: `Invoice for your ${planName} subscription`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Thank you for your payment!</h2>
          <p>Here is your invoice for the recent transaction.</p>
          <p><strong>Payment ID:</strong> ${paymentId}</p>
          <p><strong>Plan:</strong> ${planName}</p>
          <p><strong>Amount:</strong> ₹${(amount / 100).toFixed(2)}</p>
          <p>The invoice is attached to this email.</p>
          <p>If you have any questions, please contact our support team.</p>
          <br>
          <p>Best regards,<br>Flexoraa Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `invoice-${paymentId}.pdf`,
          content: invoiceBuffer.toString("base64"),
          type: "application/pdf",
        },
      ],
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Failed to send invoice email:", error);
    throw error;
  }
}
