import { useState, useEffect, useMemo } from "react";
import { Users, TrendingUp, Phone, Building2 } from "lucide-react";
import { useGoogleSheets, SheetData } from "@/hooks/useGoogleSheets";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ChartContainer } from "@/components/dashboard/ChartContainer";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { CustomTooltip, PieTooltip } from "@/components/dashboard/CustomTooltip";
import { IndicacoesDrawer } from "@/components/dashboard/IndicacoesDrawer";
import { HeatmapChart } from "@/components/dashboard/HeatmapChart";
import { useVendedorAlerts } from "@/hooks/useVendedorAlerts";
import { useGoalAlerts } from "@/hooks/useGoalAlerts";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
} from "recharts";

const COLORS = ["#14b8a6", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#10b981", "#06b6d4", "#f43f5e"];

interface AlertCallback {
  type: "warning" | "info" | "success";
  title: string;
  description: string;
}

interface ContatosPanelProps {
  isActive: boolean;
  onAlertGenerated?: (alert: AlertCallback) => void;
}

export function ContatosPanel({ isActive, onAlertGenerated }: ContatosPanelProps) {
  const { isLoading, error, fetchContatos, parseDate, normalizeText } = useGoogleSheets();
  const [data, setData] = useState<SheetData | null>(null);
  const [filters, setFilters] = useState({
    dateStart: "",
    dateEnd: "",
    company: "Todos",
  });

  // Initialize date filters with today's date - auto-update when day changes
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const savedStart = localStorage.getItem("filtro_data_inicio_contato");
    const savedEnd = localStorage.getItem("filtro_data_fim_contato");
    const savedCompany = localStorage.getItem("filtro_empresa_contato");
    
    // If saved dates are from previous days, reset to today
    const shouldResetStart = !savedStart || savedStart < today;
    const shouldResetEnd = !savedEnd || savedEnd < today;
    
    const newStart = shouldResetStart ? today : savedStart;
    const newEnd = shouldResetEnd ? today : savedEnd;
    
    // Update localStorage if we're resetting to today
    if (shouldResetStart) localStorage.setItem("filtro_data_inicio_contato", today);
    if (shouldResetEnd) localStorage.setItem("filtro_data_fim_contato", today);
    
    setFilters({
      dateStart: newStart,
      dateEnd: newEnd,
      company: savedCompany || "Todos",
    });
  }, []);

  // Load data when panel becomes active
  useEffect(() => {
    if (isActive && !data) {
      loadData();
    }
  }, [isActive]);

  const loadData = async () => {
    try {
      const result = await fetchContatos();
      setData(result);
    } catch (err) {
      console.error("Failed to load contatos:", err);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key === "dateStart") localStorage.setItem("filtro_data_inicio_contato", value);
    if (key === "dateEnd") localStorage.setItem("filtro_data_fim_contato", value);
    if (key === "company") localStorage.setItem("filtro_empresa_contato", value);
  };

  // Process data with filters
  const processedData = useMemo(() => {
    if (!data || data.rows.length === 0) {
      return {
        totalContatos: 0,
        peakDay: { date: "--", count: 0 },
        byVendedor: [],
        byProduto: [],
        byPlataforma: [],
        byDay: [],
        byDayOfWeek: [] as { dayOfWeek: number; dayName: string; count: number }[],
        companies: [],
        indicadorVendedor: [] as { vendedor: string; indicadores: Record<string, number>; total: number }[],
        indicadores: [] as string[],
        allVendedores: [] as string[],
      };
    }

    const { rows, headers } = data;
    
    // Find column indices
    const idxData = headers.findIndex((h) => h.trim().toLowerCase() === "data");
    const idxEmpresa = headers.findIndex((h) => h.trim().toLowerCase() === "empresa");
    const idxVendedor = headers.findIndex((h) => h.trim().toLowerCase() === "vendedor");
    const idxProduto = headers.findIndex((h) => h.trim().toLowerCase() === "produto");
    const idxPlataforma = headers.findIndex((h) => h.trim().toLowerCase() === "plataforma");
    const idxIndicador = headers.findIndex((h) => h.trim().toLowerCase() === "indicador");

    // Extract companies for filter
    const companiesMap = new Map<string, string>();
    rows.forEach((row) => {
      const empresa = row[headers[idxEmpresa]]?.trim();
      if (empresa) {
        const normalized = normalizeText(empresa);
        if (!companiesMap.has(normalized)) {
          companiesMap.set(normalized, empresa);
        }
      }
    });

    const companies = Array.from(companiesMap.entries()).map(([value, label]) => ({
      value,
      label,
    }));

    // Filter rows
    const filteredRows = rows.filter((row) => {
      const dataStr = row[headers[idxData]];
      const dataFormatada = parseDate(dataStr);
      const empresaNorm = normalizeText(row[headers[idxEmpresa]] || "");

      const dentroPeriodo =
        (!filters.dateStart || dataFormatada >= filters.dateStart) &&
        (!filters.dateEnd || dataFormatada <= filters.dateEnd);
      const empresaOK =
        filters.company === "Todos" || empresaNorm === filters.company;

      return dentroPeriodo && empresaOK;
    });

    // Count by vendedor
    const vendedorCount: Record<string, number> = {};
    const produtoCount: Record<string, number> = {};
    const plataformaCount: Record<string, number> = {};
    const dayCount: Record<string, number> = {};
    const dayOfWeekCount: Record<number, number> = {};
    
    // Count indicador -> vendedor relationship
    const indicadorVendedorMap: Record<string, Record<string, number>> = {};
    const indicadoresSet = new Set<string>();

    filteredRows.forEach((row) => {
      const vendedor = row[headers[idxVendedor]]?.trim() || "Sem vendedor";
      const produto = row[headers[idxProduto]]?.trim() || "Sem produto";
      const plataforma = row[headers[idxPlataforma]]?.trim() || "Sem plataforma";
      const indicador = row[headers[idxIndicador]]?.trim() || "";
      const dataStr = row[headers[idxData]];
      const dataFormatada = parseDate(dataStr);

      vendedorCount[vendedor] = (vendedorCount[vendedor] || 0) + 1;
      produtoCount[produto] = (produtoCount[produto] || 0) + 1;
      if (plataforma) plataformaCount[plataforma] = (plataformaCount[plataforma] || 0) + 1;
      if (dataFormatada) {
        dayCount[dataFormatada] = (dayCount[dataFormatada] || 0) + 1;
        // Calculate day of week (0 = Sunday, 1 = Monday, etc.)
        const dateObj = new Date(dataFormatada + "T12:00:00");
        const dayOfWeek = dateObj.getDay();
        dayOfWeekCount[dayOfWeek] = (dayOfWeekCount[dayOfWeek] || 0) + 1;
      }
      
      // Track indicador -> vendedor
      if (indicador && vendedor) {
        indicadoresSet.add(indicador);
        if (!indicadorVendedorMap[vendedor]) {
          indicadorVendedorMap[vendedor] = {};
        }
        indicadorVendedorMap[vendedor][indicador] = (indicadorVendedorMap[vendedor][indicador] || 0) + 1;
      }
    });

    // Format indicador data for table
    const indicadores = Array.from(indicadoresSet).sort();
    const indicadorVendedor = Object.entries(indicadorVendedorMap)
      .map(([vendedor, indicadores]) => ({
        vendedor,
        indicadores,
        total: Object.values(indicadores).reduce((sum, count) => sum + count, 0),
      }))
      .sort((a, b) => b.total - a.total);

    // Format for charts
    const byVendedor = Object.entries(vendedorCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    const byProduto = Object.entries(produtoCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    const byPlataforma = Object.entries(plataformaCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    const byDay = Object.entries(dayCount)
      .sort()
      .map(([date, value]) => {
        const [ano, mes, dia] = date.split("-");
        return { date: `${dia}/${mes}`, value, fullDate: date };
      });

    // Format day of week data for heatmap
    const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const byDayOfWeek = DAYS_PT.map((dayName, index) => ({
      dayOfWeek: index,
      dayName,
      count: dayOfWeekCount[index] || 0,
    }));

    // Find peak day
    let peakDay = { date: "--", count: 0 };
    Object.entries(dayCount).forEach(([date, count]) => {
      if (count > peakDay.count) {
        const [ano, mes, dia] = date.split("-");
        peakDay = { date: `${dia}/${mes}/${ano}`, count };
      }
    });

    // Get all unique vendedores for inactive detection
    const allVendedores = Object.keys(vendedorCount);

    return {
      totalContatos: filteredRows.length,
      peakDay,
      byVendedor,
      byProduto,
      byPlataforma,
      byDay,
      byDayOfWeek,
      companies,
      indicadorVendedor,
      indicadores,
      allVendedores,
    };
  }, [data, filters]);

  // Vendedor alerts - shows toast when data is loaded
  useVendedorAlerts(processedData.byVendedor, processedData.allVendedores, {}, onAlertGenerated);
  
  // Goal alerts - shows toast when goal is reached
  const periodIdentifier = `${filters.dateStart}_${filters.dateEnd}_${filters.company}`;
  useGoalAlerts(processedData.totalContatos, periodIdentifier);

  if (!isActive) return null;

  if (isLoading && !data) {
    return <LoadingState message="Carregando contatos..." />;
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Filters */}
      <FilterBar
        filters={filters}
        options={{ companies: processedData.companies }}
        onFilterChange={handleFilterChange}
        onRefresh={loadData}
        isLoading={isLoading}
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Contatos"
          value={processedData.totalContatos.toLocaleString("pt-BR")}
          icon={Users}
          variant="primary"
        />
        <MetricCard
          title="Dia de Pico"
          value={processedData.peakDay.date}
          subtitle={`${processedData.peakDay.count} contatos`}
          icon={TrendingUp}
          variant="success"
        />
        <MetricCard
          title="Vendedores Ativos"
          value={processedData.byVendedor.length}
          icon={Phone}
          variant="info"
        />
        <MetricCard
          title="Plataformas"
          value={processedData.byPlataforma.length}
          icon={Building2}
          variant="warning"
        />
      </div>

      {/* Indicador x Vendedor - Responsive Drawer */}
      <IndicacoesDrawer 
        data={processedData.indicadorVendedor} 
        indicadores={processedData.indicadores} 
      />

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartContainer
          title="📊 Contatos por Vendedor"
          isLoading={isLoading}
          isEmpty={processedData.byVendedor.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={processedData.byVendedor} layout="vertical">
              <defs>
                <linearGradient id="colorGradientContatos" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11 }}
                width={100}
              />
              <Tooltip content={<CustomTooltip valueLabel="Contatos" />} />
              <Bar dataKey="value" fill="url(#colorGradientContatos)" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="value" position="right" fill="hsl(var(--foreground))" fontSize={12} fontWeight={600} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="📈 Contatos por Dia"
          isLoading={isLoading}
          isEmpty={processedData.byDay.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={processedData.byDay}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip valueLabel="Contatos" />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(168, 76%, 42%)"
                strokeWidth={2}
                dot={{ fill: "hsl(168, 76%, 42%)", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "hsl(217, 71%, 45%)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartContainer
          title="🎯 Produtos Procurados"
          isLoading={isLoading}
          isEmpty={processedData.byProduto.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={processedData.byProduto}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {processedData.byProduto.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip valueLabel="Contatos" />} />
              <Legend 
                layout="vertical" 
                align="right" 
                verticalAlign="middle"
                wrapperStyle={{ fontSize: '12px', paddingLeft: '10px' }}
                formatter={(value: string, entry: any) => {
                  const data = processedData.byProduto.find(p => p.name === value);
                  return `${value} (${data?.value || 0})`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="🌐 Origem dos Clientes"
          isLoading={isLoading}
          isEmpty={processedData.byPlataforma.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={processedData.byPlataforma}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {processedData.byPlataforma.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip valueLabel="Contatos" />} />
              <Legend 
                layout="vertical" 
                align="right" 
                verticalAlign="middle"
                wrapperStyle={{ fontSize: '12px', paddingLeft: '10px' }}
                formatter={(value: string, entry: any) => {
                  const data = processedData.byPlataforma.find(p => p.name === value);
                  return `${value} (${data?.value || 0})`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Heatmap - Day of Week */}
      <ChartContainer
        title="🔥 Mapa de Calor - Contatos por Dia da Semana"
        isLoading={isLoading}
        isEmpty={processedData.byDayOfWeek.every(d => d.count === 0)}
      >
        <HeatmapChart data={processedData.byDayOfWeek} />
      </ChartContainer>
    </div>
  );
}
