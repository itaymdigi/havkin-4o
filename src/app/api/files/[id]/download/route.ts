import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { supabaseConfig } from "@/config/supabase";

// Create Supabase client with service role for file access
const supabaseAdmin = createClient(supabaseConfig.url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
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

    // First, verify the user owns this file
    const { data: fileData, error: fileError } = await supabaseAdmin
      .from("files")
      .select("file_path, name, uploaded_by")
      .eq("id", id)
      .single();

    if (fileError || !fileData) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (fileData.uploaded_by !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Download the file from storage
    const { data: storageData, error: storageError } = await supabaseAdmin.storage
      .from("documents")
      .download(fileData.file_path);

    if (storageError || !storageData) {
      return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
    }

    // Return the file as a blob
    const headers = new Headers();
    headers.set("Content-Disposition", `attachment; filename="${fileData.name}"`);
    headers.set("Content-Type", storageData.type || "application/octet-stream");

    return new NextResponse(storageData, {
      status: 200,
      headers,
    });
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
