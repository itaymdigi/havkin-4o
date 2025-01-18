"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { FileUploader } from "@/components/files/file-uploader"
import { FilesList } from "@/components/files/files-list"
import { useRef } from "react"

export default function FilesPage() {
  const filesListRef = useRef<{ fetchFiles: () => Promise<void> }>(null)

  const handleUploadSuccess = () => {
    filesListRef.current?.fetchFiles()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Files</h1>
        </div>
        <FileUploader onUploadSuccess={handleUploadSuccess} />
        <FilesList ref={filesListRef} />
      </div>
    </DashboardLayout>
  )
} 