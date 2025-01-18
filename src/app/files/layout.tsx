import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Files',
  description: 'Manage your files',
}

export default function FilesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 