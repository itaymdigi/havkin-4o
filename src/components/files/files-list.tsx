"use client";

import { formatDistanceToNow } from "date-fns";
import { Download, FileText, Trash2 } from "lucide-react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { formatBytes } from "@/lib/utils";

interface File {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  created_at: string;
}

interface DatabaseFile {
  id: string;
  name: string;
  file_path: string;
  size_bytes?: number;
  file_type?: string;
  created_at: string;
}

export interface FilesListRef {
  fetchFiles: () => Promise<void>;
}

export const FilesList = forwardRef<FilesListRef>((_props, ref) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch files from API
      const response = await fetch("/api/files");

      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }

      const dbFiles = await response.json();

      // Transform database files into the File interface format
      const transformedFiles: File[] = (dbFiles || []).map((file: DatabaseFile) => ({
        id: file.id,
        name: file.name,
        path: file.file_path,
        size: file.size_bytes || 0,
        type: file.file_type || "application/octet-stream",
        created_at: file.created_at,
      }));

      setFiles(transformedFiles);
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to fetch files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleDownload = async (file: File) => {
    try {
      const response = await fetch(`/api/files/${file.id}/download`);

      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      // Get the file blob
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (file: File) => {
    try {
      // Only update local state
      setFiles(files.filter((f) => f.id !== file.id));

      toast({
        title: "Success",
        description: "File hidden from view",
      });
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to hide file from view",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useImperativeHandle(ref, () => ({
    fetchFiles,
  }));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (files.length === 0) {
    return <Card className="p-6 text-center text-muted-foreground">No files uploaded yet</Card>;
  }

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <Card key={file.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="font-medium">{file.name}</h3>
                <div className="flex space-x-4 text-sm text-muted-foreground">
                  <span>{formatBytes(file.size)}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={() => handleDownload(file)}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(file)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
});

FilesList.displayName = "FilesList";
