"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Users,
  Building2,
  Calendar,
  FileText,
  Upload,
  Bell,
  Settings
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Companies", href: "/companies", icon: Building2 },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Price Offers", href: "/price-offers", icon: FileText },
  { name: "Files", href: "/files", icon: Upload },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1 px-2">
      {navigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center px-2 py-2 text-sm font-medium rounded-md",
              isActive
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon
              className={cn(
                "mr-3 h-5 w-5",
                isActive
                  ? "text-gray-500"
                  : "text-gray-400 group-hover:text-gray-500"
              )}
              aria-hidden="true"
            />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
} 