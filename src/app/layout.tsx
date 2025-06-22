import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { NotificationsProvider } from "@/components/providers/notifications-provider";
// Import stagewise toolbar wrapper component
import { StagewiseToolbarWrapper } from "@/components/stagewise-toolbar";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Streamline Business Management Platform",
  description: "A comprehensive business management solution",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased theme-amber-minimal",
            inter.className
          )}
          suppressHydrationWarning
        >
          {/* Stagewise Toolbar - only in development, client-side only */}
          <StagewiseToolbarWrapper />
          <NotificationsProvider>
            <div className="relative flex min-h-screen flex-col">
              {/* Authentication Header */}
              <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
                  <div className="font-semibold">Business Management</div>
                  <div className="flex items-center gap-4">
                    <SignedOut>
                      <SignInButton mode="modal">
                        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                          התחבר
                        </button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                          הרשמה
                        </button>
                      </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                      <UserButton afterSignOutUrl="/" />
                    </SignedIn>
                  </div>
                </div>
              </header>
              <div className="flex-1">{children}</div>
            </div>
            <Toaster />
          </NotificationsProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
