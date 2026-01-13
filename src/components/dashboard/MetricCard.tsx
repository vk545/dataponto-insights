import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "destructive" | "info";
  onClick?: () => void;
  className?: string;
  isLoading?: boolean;
}

const variantStyles = {
  default: "bg-card border-border",
  primary: "bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20",
  success: "bg-success/10 border-success/20",
  warning: "bg-warning/10 border-warning/20",
  destructive: "bg-destructive/10 border-destructive/20",
  info: "bg-info/10 border-info/20",
};

const iconVariantStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "gradient-primary text-primary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  info: "bg-info text-info-foreground",
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  onClick,
  className,
  isLoading = false,
}: MetricCardProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={cn(
        "relative flex flex-col gap-2 sm:gap-3 rounded-xl border p-3 sm:p-5 transition-all duration-200 text-left w-full",
        variantStyles[variant],
        onClick && "cursor-pointer hover:shadow-elevated hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-2 sm:truncate">
            {title}
          </p>
          {isLoading ? (
            <div className="mt-1 sm:mt-2 h-6 sm:h-8 w-16 sm:w-24 rounded-md skeleton-shimmer" />
          ) : (
            <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-bold tracking-tight text-foreground animate-fade-in break-all">
              {value}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg",
              iconVariantStyles[variant]
            )}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center gap-2 text-sm">
          {trend && (
            <span
              className={cn(
                "font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          )}
          {subtitle && (
            <span className="text-muted-foreground truncate">{subtitle}</span>
          )}
        </div>
      )}
    </Component>
  );
}
