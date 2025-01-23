'use client';

import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export function LogoutButton() {
  const handleLogout = () => {
    // Sign out and redirect immediately
    supabase.auth.signOut().then(() => {
      // Clear any stored data
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect to login
      window.location.replace('/login');
    }).catch((error) => {
      console.error('Error signing out:', error);
    });
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