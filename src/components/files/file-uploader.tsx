"use client"

import { useState } from "react"
import { Upload, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

interface FileUploaderProps {
  onUploadSuccess: () => void;
}

interface FileData {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  url: string | null;
  size: number;
  size_bytes: number;
  type: string | null;
  uploaded_by: string;
  owner: string;
  company_id?: string | null;
  contact_id?: string | null;
  created_at: string;
  updated_at: string | null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export function FileUploader({ onUploadSuccess }: FileUploaderProps): JSX.Element {
  const [uploading, setUploading] = useState<boolean>(false)
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    try {
      const file = event.target.files?.[0]
      if (!file) return

      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 10MB limit')
      }

      setUploading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Create a safe filename by removing special characters and spaces
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const timestamp = new Date().getTime()
      const fileName = `${timestamp}_${safeFileName}`
      const folderPath = `${user.id}/${fileName}`

      // Upload file to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('files')
        .upload(folderPath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (storageError) {
        console.error('Storage error:', storageError)
        throw new Error(`Upload failed: ${storageError.message}`)
      }

      if (!storageData?.path) {
        throw new Error('No file path returned from storage')
      }

      // Get the public URL for the file
      const { data: publicUrl } = supabase.storage
        .from('files')
        .getPublicUrl(storageData.path)

      const now = new Date().toISOString()
      const fileData: Omit<FileData, 'id'> = {
        name: file.name,
        file_path: storageData.path,
        file_type: file.type || 'application/octet-stream',
        url: publicUrl?.publicUrl || null,
        size: file.size,
        size_bytes: file.size,
        type: file.type || null,
        uploaded_by: user.id,
        owner: user.id,
        created_at: now,
        updated_at: now,
        company_id: null,
        contact_id: null
      }

      // Create a record in the files table
      const { error: dbError } = await supabase
        .from('files')
        .insert([fileData])

      if (dbError) {
        // If database insert fails, try to clean up the uploaded file
        await supabase.storage
          .from('files')
          .remove([storageData.path])
        throw new Error(`Database error: ${dbError.message}`)
      }

      toast({
        title: "Success",
        description: "File uploaded successfully",
      })

      onUploadSuccess()
      event.target.value = ''
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="file-upload"
          className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${
            uploading ? 'pointer-events-none' : ''
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Loader2 className="w-8 h-8 mb-4 text-gray-500 animate-spin" />
              <p className="text-sm text-gray-500">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-4 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">Any file up to 10MB</p>
            </div>
          )}
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>
      </div>
    </Card>
  )
} 