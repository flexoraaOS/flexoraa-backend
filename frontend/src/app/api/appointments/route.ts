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

    // Fetch appointments from database
    const { data: appointments, error: dbError } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (dbError) {
      console.error("Database error fetching appointments:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch appointments from database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      appointments: appointments || [],
      count: appointments?.length || 0,
    });
  } catch (error) {
    console.error("Error in appointments API:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching appointments" },
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
    const { date, time, leadId, with: withPerson, conversation } = body;

    if (!date || !time || !leadId || !withPerson) {
      return NextResponse.json(
        { error: "Missing required fields: date, time, leadId, with" },
        { status: 400 }
      );
    }

    // Insert appointment into database
    const { data: appointment, error: dbError } = await supabase
      .from("appointments")
      .insert({
        user_id: user.id,
        date: new Date(date).toISOString(),
        time,
        lead_id: leadId,
        with_person: withPerson,
        conversation: conversation || "",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error creating appointment:", dbError);
      return NextResponse.json(
        { error: "Failed to create appointment in database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      appointment,
      message: "Appointment created successfully",
    });
  } catch (error) {
    console.error("Error in appointments POST API:", error);
    return NextResponse.json(
      { error: "Internal server error while creating appointment" },
      { status: 500 }
    );
  }
}
