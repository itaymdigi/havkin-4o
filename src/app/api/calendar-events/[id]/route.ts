import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { supabaseConfig } from "@/config/supabase";

// Create Supabase client - using anon key with RLS policies
const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data, error } = await supabase
      .from("calendar_events")
      .select(`
        *,
        contact:contacts(*)
      `)
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to fetch calendar event" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Calendar event not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, location, start_time, end_time, contact_id } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (contact_id !== undefined) updateData.contact_id = contact_id;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("calendar_events")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select();

    if (error) {
      return NextResponse.json({ error: "Failed to update calendar event" }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Calendar event not found" }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: "Failed to delete calendar event" }, { status: 500 });
    }

    return NextResponse.json({ message: "Calendar event deleted successfully" });
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
