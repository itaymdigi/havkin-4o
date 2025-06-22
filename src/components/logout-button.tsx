"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (_error) {}
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="text-muted-foreground hover:text-primary"
    >
      <LogOut className="h-4 w-4" />
      <span className="mr-2 rtl:ml-2">התנתק</span>
    </Button>
  );
}
