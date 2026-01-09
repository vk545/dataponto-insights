import { TooltipProps } from "recharts";

interface CustomTooltipProps extends TooltipProps<number, string> {
  valueLabel?: string;
}

export function CustomTooltip({ active, payload, label, valueLabel = "Valor" }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      {label && (
        <p className="mb-1 text-sm font-medium text-card-foreground">{label}</p>
      )}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: entry.color || entry.fill }}
          />
          <span className="text-sm text-muted-foreground">{valueLabel}:</span>
          <span className="text-sm font-semibold text-card-foreground">
            {typeof entry.value === "number" ? entry.value.toLocaleString("pt-BR") : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

interface PieTooltipProps extends TooltipProps<number, string> {
  valueLabel?: string;
}

export function PieTooltip({ active, payload, valueLabel = "Valor" }: PieTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0];
  const name = data.name || data.payload?.name || "";
  const value = data.value;
  const color = data.payload?.fill || data.color;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-sm font-medium text-card-foreground">{name}</p>
      <div className="flex items-center gap-2">
        <div
          className="h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm text-muted-foreground">{valueLabel}:</span>
        <span className="text-sm font-semibold text-card-foreground">
          {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
        </span>
      </div>
    </div>
  );
}
