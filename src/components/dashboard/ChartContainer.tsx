import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export function ChartContainer({
  title,
  children,
  className,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "Nenhum dado disponível",
}: ChartContainerProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border border-border bg-card p-5 shadow-card",
        className
      )}
    >
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>

      <div className="relative flex-1 min-h-[300px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando dados...</p>
            </div>
          </div>
        ) : isEmpty ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </div>
          </div>
        ) : (
          <div className="h-full w-full animate-fade-in">{children}</div>
        )}
      </div>
    </div>
  );
}
