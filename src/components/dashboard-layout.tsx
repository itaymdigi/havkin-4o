"use client";

import { LogoutButton } from "./logout-button";
import { NotificationsDropdown } from "./notifications/notifications-dropdown";
import { SidebarNav } from "./sidebar-nav";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center justify-between flex-shrink-0 px-4">
              <h1 className="text-xl font-semibold">Business Manager</h1>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <NotificationsDropdown />
                <LogoutButton />
              </div>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <SidebarNav />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-semibold">Business Manager</h1>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <NotificationsDropdown />
            <LogoutButton />
          </div>
        </div>
        <main className="flex-1 pb-8">
          <div className="mt-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
