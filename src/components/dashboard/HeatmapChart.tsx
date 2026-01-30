import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

interface HeatmapData {
  dayOfWeek: number;
  dayName: string;
  count: number;
  date?: string; // ISO date string for filtering
}

interface HeatmapChartProps {
  data: HeatmapData[];
  /** Raw data with dates for independent filtering */
  rawData?: { date: string; count: number }[];
}

type HeatmapPeriod = "filtro" | "semana" | "mes";

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getHeatColor(value: number, max: number): string {
  if (max === 0 || value === 0) return "hsl(var(--muted))";
  
  const intensity = value / max;
  
  if (intensity <= 0.25) return "hsl(168, 76%, 85%)";
  if (intensity <= 0.5) return "hsl(168, 76%, 65%)";
  if (intensity <= 0.75) return "hsl(168, 76%, 45%)";
  return "hsl(168, 76%, 30%)";
}

function getDateRange(period: HeatmapPeriod): { start: Date; end: Date } {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  const start = new Date();
  
  switch (period) {
    case "semana":
      start.setDate(today.getDate() - 6);
      break;
    case "mes":
      start.setDate(today.getDate() - 29);
      break;
    default:
      // For "filtro", we return a range that won't filter (handled separately)
      return { start: new Date(0), end: today };
  }
  
  start.setHours(0, 0, 0, 0);
  return { start, end: today };
}

export function HeatmapChart({ data, rawData }: HeatmapChartProps) {
  const [period, setPeriod] = useState<HeatmapPeriod>("filtro");

  const { heatmapData, maxValue } = useMemo(() => {
    let filteredData = data;
    
    // If we have rawData and a period filter, calculate from rawData
    if (rawData && period !== "filtro") {
      const { start, end } = getDateRange(period);
      
      const dayOfWeekCount: Record<number, number> = {};
      
      rawData.forEach(item => {
        const itemDate = new Date(item.date + "T12:00:00");
        
        if (itemDate >= start && itemDate <= end) {
          const dayOfWeek = itemDate.getDay();
          dayOfWeekCount[dayOfWeek] = (dayOfWeekCount[dayOfWeek] || 0) + item.count;
        }
      });
      
      filteredData = DAYS_PT.map((dayName, index) => ({
        dayOfWeek: index,
        dayName,
        count: dayOfWeekCount[index] || 0,
      }));
    }

    // Ensure we have all 7 days
    const dayMap = new Map<number, number>();
    filteredData.forEach(d => {
      dayMap.set(d.dayOfWeek, (dayMap.get(d.dayOfWeek) || 0) + d.count);
    });

    const heatmapData = DAYS_PT.map((name, index) => ({
      dayOfWeek: index,
      dayName: name,
      count: dayMap.get(index) || 0,
    }));

    const maxValue = Math.max(...heatmapData.map(d => d.count), 1);

    return { heatmapData, maxValue };
  }, [data, rawData, period]);

  const total = heatmapData.reduce((sum, d) => sum + d.count, 0);
  const peakDay = heatmapData.reduce((max, d) => (d.count > max.count ? d : max), heatmapData[0]);

  const periodLabels: Record<HeatmapPeriod, string> = {
    filtro: "Período do Filtro",
    semana: "Última Semana",
    mes: "Último Mês",
  };

  return (
    <div className="space-y-4">
      {/* Period Filter - Independent from main filter */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {(["filtro", "semana", "mes"] as HeatmapPeriod[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p)}
            className={period === p ? "gradient-primary text-primary-foreground" : ""}
          >
            {periodLabels[p]}
          </Button>
        ))}
      </div>

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
