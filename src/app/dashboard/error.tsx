"use client";

import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {}, []);

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
      <div className="flex items-center space-x-2 text-red-500">
        <AlertCircle className="h-6 w-6" />
        <h2 className="text-lg font-semibold">Something went wrong!</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        {error.message || "An error occurred while loading the dashboard."}
      </p>
      <Button variant="outline" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
