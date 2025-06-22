"use client";

import { useEffect, useState } from "react";

// Error boundary for Stagewise toolbar
function StagewiseErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (
        event.error?.message?.includes("stagewise") ||
        event.error?.stack?.includes("stagewise")
      ) {
        setHasError(true);
      }
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (hasError) {
    return null; // Silently fail for toolbar
  }

  return <>{children}</>;
}

// Client component wrapper for StagewiseToolbar
export function StagewiseToolbarWrapper() {
  const [isClient, setIsClient] = useState(false);
  const [isReady, setIsReady] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [StagewiseToolbar, setStagewiseToolbar] = useState<React.ComponentType<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ReactPlugin, setReactPlugin] = useState<any>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Mark as client-side
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only proceed if we're on client and in development
    if (!isClient || process.env.NODE_ENV !== "development") return;

    // Add a small delay to ensure DOM is fully hydrated
    const timer = setTimeout(() => {
      // Dynamically import both packages
      Promise.all([
        import("@stagewise/toolbar-react").catch((_err) => {
          setHasError(true);
          return null;
        }),
        import("@stagewise-plugins/react").catch((_err) => {
          setHasError(true);
          return null;
        }),
      ]).then(([toolbarModule, pluginModule]) => {
        if (toolbarModule?.StagewiseToolbar && pluginModule?.ReactPlugin) {
          setStagewiseToolbar(() => toolbarModule.StagewiseToolbar);
          setReactPlugin(pluginModule.ReactPlugin);
          setIsReady(true);
        } else {
          setHasError(true);
        }
      });
    }, 200); // Increased delay for better hydration

    return () => clearTimeout(timer);
  }, [isClient]);

  // Don't render if there's an error or not ready
  if (!isClient || hasError || !isReady || !StagewiseToolbar || !ReactPlugin) {
    return null;
  }

  return (
    <StagewiseErrorBoundary>
      <div suppressHydrationWarning style={{ position: "relative", zIndex: 9999 }}>
        <StagewiseToolbar
          config={{
            plugins: [ReactPlugin],
          }}
        />
      </div>
    </StagewiseErrorBoundary>
  );
}
