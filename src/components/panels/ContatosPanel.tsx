import { useState, useEffect, useMemo } from "react";
import { Users, TrendingUp, Phone, Building2 } from "lucide-react";
import { useGoogleSheets, SheetData } from "@/hooks/useGoogleSheets";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ChartContainer } from "@/components/dashboard/ChartContainer";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { CustomTooltip, PieTooltip } from "@/components/dashboard/CustomTooltip";
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
} from "recharts";

const COLORS = ["#14b8a6", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#10b981", "#06b6d4", "#f43f5e"];

interface ContatosPanelProps {
  isActive: boolean;
}

export function ContatosPanel({ isActive }: ContatosPanelProps) {
  const { isLoading, error, fetchContatos, parseDate, normalizeText } = useGoogleSheets();
  const [data, setData] = useState<SheetData | null>(null);
  const [filters, setFilters] = useState({
    dateStart: "",
    dateEnd: "",
    company: "Todos",
  });

  // Initialize date filters with today's date as default
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const savedStart = localStorage.getItem("filtro_data_inicio_contato");
    const savedEnd = localStorage.getItem("filtro_data_fim_contato");
    const savedCompany = localStorage.getItem("filtro_empresa_contato");
    
    setFilters({
      dateStart: savedStart || today,
      dateEnd: savedEnd || today,
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
        companies: [],
        indicadorVendedor: [] as { vendedor: string; indicadores: Record<string, number>; total: number }[],
        indicadores: [] as string[],
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
      if (dataFormatada) dayCount[dataFormatada] = (dayCount[dataFormatada] || 0) + 1;
      
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

    // Find peak day
    let peakDay = { date: "--", count: 0 };
    Object.entries(dayCount).forEach(([date, count]) => {
      if (count > peakDay.count) {
        const [ano, mes, dia] = date.split("-");
        peakDay = { date: `${dia}/${mes}/${ano}`, count };
      }
    });

    return {
      totalContatos: filteredRows.length,
      peakDay,
      byVendedor,
      byProduto,
      byPlataforma,
      byDay,
      companies,
      indicadorVendedor,
      indicadores,
    };
  }, [data, filters]);

  if (!isActive) return null;

  if (isLoading && !data) {
    return <LoadingState message="Carregando contatos..." />;
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters */}
      <FilterBar
        filters={filters}
        options={{ companies: processedData.companies }}
        onFilterChange={handleFilterChange}
        onRefresh={loadData}
        isLoading={isLoading}
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <Bar dataKey="value" fill="url(#colorGradientContatos)" radius={[0, 4, 4, 0]} />
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
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {processedData.byProduto.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip valueLabel="Contatos" />} />
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
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {processedData.byPlataforma.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip valueLabel="Contatos" />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Indicador x Vendedor Table */}
      {processedData.indicadorVendedor.length > 0 && (
        <ChartContainer
          title="📋 Contatos por Indicador x Vendedor"
          isLoading={isLoading}
          isEmpty={processedData.indicadorVendedor.length === 0}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Vendedor</th>
                  {processedData.indicadores.map((indicador) => (
                    <th key={indicador} className="px-4 py-3 text-center font-semibold text-foreground">
                      {indicador}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center font-semibold text-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {processedData.indicadorVendedor.map((row, index) => (
                  <tr 
                    key={row.vendedor} 
                    className={`border-b border-border/50 ${index % 2 === 0 ? 'bg-muted/30' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{row.vendedor}</td>
                    {processedData.indicadores.map((indicador) => (
                      <td key={indicador} className="px-4 py-3 text-center text-muted-foreground">
                        {row.indicadores[indicador] || 0}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center font-bold text-foreground">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartContainer>
      )}
    </div>
  );
}
