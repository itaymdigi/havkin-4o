import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./button";

interface PageHeaderProps {
  title: string;
  backUrl?: string;
}

export function PageHeader({ title, backUrl = "/dashboard" }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(backUrl)}
          className="rtl:rotate-180"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
    </div>
  );
}
