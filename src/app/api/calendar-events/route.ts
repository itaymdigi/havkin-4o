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

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("calendar_events")
      .select(`
        *,
        contact:contacts(*)
      `)
      .eq("user_id", userId)
      .order("start_time", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, location, start_time, end_time, contact_id } = body;

    if (!title || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Title, start_time, and end_time are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("calendar_events")
      .insert([
        {
          user_id: userId,
          title,
          description: description || null,
          location: location || null,
          start_time,
          end_time,
          contact_id: contact_id || null,
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: "Failed to create calendar event" }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
