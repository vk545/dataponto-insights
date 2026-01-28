import { useMemo } from "react";
import { Tooltip, ResponsiveContainer } from "recharts";

interface HeatmapData {
  dayOfWeek: number;
  dayName: string;
  count: number;
}

interface HeatmapChartProps {
  data: HeatmapData[];
}

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getHeatColor(value: number, max: number): string {
  if (max === 0 || value === 0) return "hsl(var(--muted))";
  
  const intensity = value / max;
  
  if (intensity <= 0.25) return "hsl(168, 76%, 85%)";
  if (intensity <= 0.5) return "hsl(168, 76%, 65%)";
  if (intensity <= 0.75) return "hsl(168, 76%, 45%)";
  return "hsl(168, 76%, 30%)";
}

export function HeatmapChart({ data }: HeatmapChartProps) {
  const { heatmapData, maxValue } = useMemo(() => {
    // Ensure we have all 7 days
    const dayMap = new Map<number, number>();
    data.forEach(d => {
      dayMap.set(d.dayOfWeek, (dayMap.get(d.dayOfWeek) || 0) + d.count);
    });

    const heatmapData = DAYS_PT.map((name, index) => ({
      dayOfWeek: index,
      dayName: name,
      count: dayMap.get(index) || 0,
    }));

    const maxValue = Math.max(...heatmapData.map(d => d.count), 1);

    return { heatmapData, maxValue };
  }, [data]);

  const total = heatmapData.reduce((sum, d) => sum + d.count, 0);
  const peakDay = heatmapData.reduce((max, d) => (d.count > max.count ? d : max), heatmapData[0]);

  return (
    <div className="space-y-4">
      {/* Heatmap Grid */}
      <div className="flex gap-2 justify-center flex-wrap">
        {heatmapData.map((day) => (
          <div
            key={day.dayOfWeek}
            className="flex flex-col items-center gap-1 group relative"
          >
            <span className="text-xs text-muted-foreground font-medium">
              {day.dayName}
            </span>
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-200 hover:scale-110 cursor-pointer shadow-sm"
              style={{
                backgroundColor: getHeatColor(day.count, maxValue),
                color: day.count > maxValue * 0.5 ? "white" : "hsl(var(--foreground))",
              }}
            >
              {day.count}
            </div>
            {/* Tooltip */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {day.count} contatos
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Menos</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(var(--muted))" }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(168, 76%, 85%)" }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(168, 76%, 65%)" }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(168, 76%, 45%)" }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(168, 76%, 30%)" }} />
          </div>
          <span>Mais</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="text-center">
          <p className="text-muted-foreground">Total no Período</p>
          <p className="font-bold text-lg">{total}</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">Dia de Pico</p>
          <p className="font-bold text-lg text-primary">{peakDay.dayName} ({peakDay.count})</p>
        </div>
      </div>
    </div>
  );
}
