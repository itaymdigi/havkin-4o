import { DashboardLayout } from "@/components/dashboard-layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Stats Overview Loading */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="p-6 space-y-4">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-8 w-[100px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>

        {/* Charts Loading */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="col-span-2 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <Skeleton className="h-8 w-[200px] mb-4" />
              <Skeleton className="h-[300px] w-full" />
            </div>
          </div>

          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <Skeleton className="h-8 w-[150px] mb-4" />
                <Skeleton className="h-[200px] w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
