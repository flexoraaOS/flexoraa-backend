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

    // Fetch notifications from database
    const { data: notifications, error: dbError } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("read", false)
      .order("created_at", { ascending: false })
      .limit(10);

    if (dbError) {
      console.error("Database error fetching notifications:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch notifications from database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      notifications: notifications || [],
      count: notifications?.length || 0,
    });
  } catch (error) {
    console.error("Error in notifications API:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching notifications" },
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
    const { type, title, description, leadId } = body;

    if (!type || !title) {
      return NextResponse.json(
        { error: "Missing required fields: type, title" },
        { status: 400 }
      );
    }

    // Insert notification into database
    const { data: notification, error: dbError } = await supabase
      .from("notifications")
      .insert({
        user_id: user.id,
        type,
        title,
        description: description || "",
        lead_id: leadId || null,
        read: false,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error creating notification:", dbError);
      return NextResponse.json(
        { error: "Failed to create notification in database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      notification,
      message: "Notification created successfully",
    });
  } catch (error) {
    console.error("Error in notifications POST API:", error);
    return NextResponse.json(
      { error: "Internal server error while creating notification" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const { notificationId, read } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: "Missing notificationId" },
        { status: 400 }
      );
    }

    // Update notification read status
    const { data: notification, error: dbError } = await supabase
      .from("notifications")
      .update({ read: read ?? true })
      .eq("id", notificationId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (dbError) {
      console.error("Database error updating notification:", dbError);
      return NextResponse.json(
        { error: "Failed to update notification in database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      notification,
      message: "Notification updated successfully",
    });
  } catch (error) {
    console.error("Error in notifications PATCH API:", error);
    return NextResponse.json(
      { error: "Internal server error while updating notification" },
      { status: 500 }
    );
  }
}
