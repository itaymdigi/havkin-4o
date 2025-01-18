"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { FileIcon, Loader2, TrashIcon, UploadIcon } from "lucide-react"
import { formatBytes, formatDateTime } from "@/lib/utils"
import { useAuth } from "@/components/providers/supabase-auth-provider"
import { useRouter } from "next/navigation"

type FileRecord = {
  id: string
  name: string
  file_path: string
  file_type: string
  size_bytes: number
  contact_id: string | null
  created_at: string
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  // Check authentication
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const fetchFiles = async () => {
    setIsLoading(true)
    try {
      const { data: filesData, error: filesError } = await supabase
        .from("files")
        .select("*")
        .order("created_at", { ascending: false })

      if (filesError) throw filesError
      setFiles(filesData || [])
    } catch (error) {
      console.error("Error fetching files:", error)
      toast({
        title: "Error",
        description: "Failed to fetch files",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchContacts = async () => {
    try {
      const { data: contactsData, error: contactsError } = await supabase
        .from("contacts")
        .select("id, first_name, last_name")
        .order("first_name", { ascending: true })

      if (contactsError) throw contactsError
      setContacts(contactsData || [])
    } catch (error) {
      console.error("Error fetching contacts:", error)
    }
  }

  // Fetch files and contacts on component mount
  useEffect(() => {
    fetchFiles()
    fetchContacts()
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload files",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      // Generate file name
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      
      console.log('Upload attempt:', { 
        fileName, 
        fileType: file.type, 
        fileSize: file.size,
        userId: user.id 
      })
      
      // 1. Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
          duplex: 'half',
          metadata: {
            owner: user.id,
            mimetype: file.type,
            size: file.size.toString(),
            filename: file.name
          }
        })

      if (uploadError) {
        console.error('Storage upload error details:', {
          error: uploadError,
          message: uploadError.message,
          statusCode: uploadError.statusCode,
          name: uploadError.name,
          stack: uploadError.stack
        })
        throw new Error(`Storage upload failed: ${uploadError.message || 'Unknown error'}`)
      }

      console.log('File uploaded successfully:', uploadData)

      // 2. Create file record in the database
      const fileData = {
        name: file.name,
        file_path: fileName,
        file_type: file.type,
        size_bytes: file.size,
        uploaded_by: user.id,
        owner: user.id  // explicitly set owner
      }
      
      console.log('Creating database record:', fileData)

      const { data: fileRecord, error: dbError } = await supabase
        .from("files")
        .insert([fileData])
        .select()
        .single()

      if (dbError) {
        console.error('Database insert error:', dbError)
        // If DB insert fails, try to clean up the uploaded file
        await supabase.storage.from("documents").remove([fileName])
        throw new Error(`Database insert failed: ${dbError.message}`)
      }

      // 3. Update local state
      setFiles((prev) => [fileRecord, ...prev])
      toast({
        title: "Success",
        description: "File uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Reset the file input
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const handleDeleteFile = async (fileId: string, filePath: string) => {
    try {
      // 1. Delete from Storage
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([filePath])

      if (storageError) throw storageError

      // 2. Delete from database
      const { error: dbError } = await supabase
        .from("files")
        .delete()
        .eq("id", fileId)

      if (dbError) throw dbError

      // 3. Update local state
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
      toast({
        title: "Success",
        description: "File deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting file:", error)
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  const handleAssignContact = async (fileId: string, contactId: string | null) => {
    try {
      const { error } = await supabase
        .from("files")
        .update({ contact_id: contactId })
        .eq("id", fileId)

      if (error) throw error

      // Update local state
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, contact_id: contactId } : f
        )
      )
      toast({
        title: "Success",
        description: "File assigned successfully",
      })
    } catch (error) {
      console.error("Error assigning contact:", error)
      toast({
        title: "Error",
        description: "Failed to assign contact",
        variant: "destructive",
      })
    }
  }

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath, 60) // URL valid for 60 seconds

      if (error) {
        console.error('Error creating download URL:', error)
        throw error
      }

      // Create a link and click it to start the download
      const link = document.createElement('a')
      link.href = data.signedUrl
      link.download = fileName // Set the file name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error downloading file:", error)
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Files</h2>
          <p className="text-muted-foreground">
            Manage your documents and files
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Upload new documents or files to your storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              {isUploading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Files</CardTitle>
            <CardDescription>
              View and manage your uploaded files
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : files.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No files uploaded yet
              </p>
            ) : (
              <div className="space-y-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div 
                      className="flex items-center gap-4 cursor-pointer"
                      onClick={() => handleDownload(file.file_path, file.name)}
                    >
                      <FileIcon className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatBytes(file.size_bytes)} •{" "}
                          {formatDateTime(new Date(file.created_at))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Select
                        value={file.contact_id || ""}
                        onValueChange={(value) =>
                          handleAssignContact(
                            file.id,
                            value === "" ? null : value
                          )
                        }
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Assign to contact" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {contacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.first_name} {contact.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() =>
                          handleDeleteFile(file.id, file.file_path)
                        }
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 