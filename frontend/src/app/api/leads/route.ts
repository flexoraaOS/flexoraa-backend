import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/api/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const limit = parseInt(searchParams.get("limit") || "100");

    // Build query
    let query = supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Apply filters if provided
    if (status) {
      query = query.eq("status", status);
    }

    if (source) {
      query = query.eq("source", source);
    }

    const { data: leads, error: dbError } = await query;

    if (dbError) {
      console.error("Database error fetching leads:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch leads from database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      leads: leads || [],
      count: leads?.length || 0,
    });
  } catch (error) {
    console.error("Error in leads API:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching leads" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone_number,
      source,
      status,
      has_whatsapp,
      metadata,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    // Insert lead into database
    const { data: lead, error: dbError } = await supabase
      .from("leads")
      .insert({
        user_id: user.id,
        name,
        email: email || null,
        phone_number: phone_number || null,
        source: source || "manual",
        status: status || "new",
        has_whatsapp: has_whatsapp || false,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error creating lead:", dbError);
      return NextResponse.json(
        { error: "Failed to create lead in database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      lead,
      message: "Lead created successfully",
    });
  } catch (error) {
    console.error("Error in leads POST API:", error);
    return NextResponse.json(
      { error: "Internal server error while creating lead" },
      { status: 500 }
    );
  }
}
