import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { supabaseConfig } from "@/config/supabase";

// Create Supabase client with service role for server operations
const supabaseAdmin = createClient(supabaseConfig.url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    // Create a safe filename
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const timestamp = Date.now();
    const fileName = `${timestamp}_${safeFileName}`;
    const folderPath = `${userId}/${fileName}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const { data: storageData, error: storageError } = await supabaseAdmin.storage
      .from("documents")
      .upload(folderPath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (storageError) {
      return NextResponse.json(
        { error: `Upload failed: ${storageError.message}` },
        { status: 500 }
      );
    }

    if (!storageData?.path) {
      return NextResponse.json({ error: "No file path returned from storage" }, { status: 500 });
    }

    // Create database record using admin client
    const now = new Date().toISOString();
    const fileData = {
      name: file.name,
      file_path: storageData.path,
      file_type: file.type || "application/octet-stream",
      size_bytes: file.size,
      uploaded_by: userId,
      created_at: now,
      company_id: null,
      contact_id: null,
    };

    const { data: dbData, error: dbError } = await supabaseAdmin
      .from("files")
      .insert([fileData])
      .select()
      .single();

    if (dbError) {
      // Clean up the uploaded file if database insert fails
      await supabaseAdmin.storage.from("documents").remove([storageData.path]);
      return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      message: "File uploaded successfully",
      file: dbData,
    });
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
