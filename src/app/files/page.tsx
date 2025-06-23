"use client";

import { useRef } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { FileUploader } from "@/components/files/file-uploader";
import { FilesList } from "@/components/files/files-list";
import Link from "next/link";

export default function FilesPage() {
  const filesListRef = useRef<{ fetchFiles: () => Promise<void> }>(null);

  const handleUploadSuccess = () => {
    filesListRef.current?.fetchFiles();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Files</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Files</h1>
        </div>
        <FileUploader onUploadSuccess={handleUploadSuccess} />
        <FilesList ref={filesListRef} />
      </div>
    </DashboardLayout>
  );
}
