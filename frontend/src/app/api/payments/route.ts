import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/api/supabase-admin";

export async function GET(req: Request) {
  const supabase = getSupabaseAdmin();

  try {
    // Get user_id from request headers (should be set by middleware or auth)
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      console.log("Unauthorized: No user_id provided");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: payments, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "success")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payments:", error);
      return NextResponse.json(
        { error: "Failed to fetch payments" },
        { status: 500 }
      );
    }

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Payments API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
