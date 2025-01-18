"use client"

import { forwardRef, useImperativeHandle, useEffect, useState, useCallback } from "react"
import { FileText, Trash2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { formatBytes } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface File {
  id: string
  name: string
  path: string
  size: number
  type: string
  created_at: string
}

export interface FilesListRef {
  fetchFiles: () => Promise<void>
}

export const FilesList = forwardRef<FilesListRef>((props, ref) => {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.storage.from('files').list()
      if (error) throw error
      setFiles(data || [])
    } catch (error) {
      console.error('Error fetching files:', error)
      toast({
        title: "Error",
        description: "Failed to fetch files",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const handleDownload = async (file: File) => {
    try {
      const { data, error } = await supabase.storage
        .from('files')
        .download(file.path)

      if (error) throw error

      // Create a download link
      const url = window.URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (file: File) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([file.path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', file.id)

      if (dbError) throw dbError

      // Update local state
      setFiles(files.filter(f => f.id !== file.id))

      toast({
        title: "Success",
        description: "File deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting file:', error)
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  useImperativeHandle(ref, () => ({
    fetchFiles
  }))

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        No files uploaded yet
      </Card>
    )
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDownload(file)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(file)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
})

FilesList.displayName = "FilesList" 