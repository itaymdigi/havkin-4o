import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { supabaseConfig } from "@/config/supabase";

// Create Supabase client with service role key (bypasses RLS)
// Note: For production, you should use a service role key instead of anon key
const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey, // TODO: Replace with service role key for production
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { first_name, last_name, email, phone, position, company_id } = body;

    // First verify the contact belongs to the user
    const { data: existingContact, error: fetchError } = await supabase
      .from("contacts")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingContact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    if (existingContact.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("contacts")
      .update({
        first_name,
        last_name,
        email: email || null,
        phone: phone || null,
        position: position || null,
        company_id: company_id || null,
      })
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
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

    // First verify the contact belongs to the user
    const { data: existingContact, error: fetchError } = await supabase
      .from("contacts")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingContact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    if (existingContact.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("contacts").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
