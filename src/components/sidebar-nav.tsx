"use client";

import {
  BarChart3,
  Bell,
  Building2,
  Calendar,
  FileText,
  MessageSquare,
  Settings,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Companies", href: "/companies", icon: Building2 },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Price Offers", href: "/price-offers", icon: FileText },
  { name: "WhatsApp", href: "/whatsapp", icon: MessageSquare },
  { name: "Files", href: "/files", icon: Upload },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2 px-3">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
              isActive
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <item.icon
              className={cn(
                "mr-3 h-5 w-5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )}
              aria-hidden="true"
            />
            <span className="font-medium">{item.name}</span>
            {isActive && <div className="ml-auto h-2 w-2 rounded-full bg-primary" />}
          </Link>
        );
      })}
    </nav>
  );
}
