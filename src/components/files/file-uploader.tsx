"use client";

import { useUser } from "@clerk/nextjs";
import { Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface FileUploaderProps {
  onUploadSuccess: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export function FileUploader({ onUploadSuccess }: FileUploaderProps): JSX.Element {
  const [uploading, setUploading] = useState<boolean>(false);
  const { toast } = useToast();
  const { user } = useUser();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size exceeds 10MB limit");
      }

      setUploading(true);

      if (!user) throw new Error("User not authenticated");

      // Create FormData for the API request
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/files/upload?v=2", {
        method: "POST",
        body: formData,
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      await response.json();

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      onUploadSuccess();
      event.target.value = "";
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="file-upload"
          className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${
            uploading ? "pointer-events-none" : ""
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
  );
}
