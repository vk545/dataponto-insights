import { useState, useEffect, useMemo } from "react";
import { Phone, TrendingUp, TrendingDown, Users } from "lucide-react";
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
  LabelList,
} from "recharts";

const COLORS = ["#14b8a6", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#10b981", "#06b6d4", "#f43f5e"];

interface LigacoesPanelProps {
  isActive: boolean;
}

export function LigacoesPanel({ isActive }: LigacoesPanelProps) {
  const { isLoading, error, fetchLigacoes, parseDate, normalizeText } = useGoogleSheets();
  const [data, setData] = useState<SheetData | null>(null);
  const [filters, setFilters] = useState(() => {
    const today = new Date().toISOString().split("T")[0];
    return {
      dateStart: today,
      dateEnd: today,
      company: "Todos",
      collaborator: "Todos",
    };
  });

  // Load saved filters or use today - auto-update when day changes
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const savedStart = localStorage.getItem("filtro_data_inicio");
    const savedEnd = localStorage.getItem("filtro_data_fim");
    
    // If saved dates are from previous days, reset to today
    const shouldResetStart = !savedStart || savedStart < today;
    const shouldResetEnd = !savedEnd || savedEnd < today;
    
    const newStart = shouldResetStart ? today : savedStart;
    const newEnd = shouldResetEnd ? today : savedEnd;
    
    // Update localStorage if we're resetting to today
    if (shouldResetStart) localStorage.setItem("filtro_data_inicio", today);
    if (shouldResetEnd) localStorage.setItem("filtro_data_fim", today);
    
    setFilters((prev) => ({
      ...prev,
      dateStart: newStart,
      dateEnd: newEnd,
    }));
  }, []);

  // Load data when panel becomes active
  useEffect(() => {
    if (isActive && !data) {
      loadData();
    }
  }, [isActive]);

  const loadData = async () => {
    try {
      const result = await fetchLigacoes();
      setData(result);
    } catch (err) {
      console.error("Failed to load ligacoes:", err);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key === "dateStart") localStorage.setItem("filtro_data_inicio", value);
    if (key === "dateEnd") localStorage.setItem("filtro_data_fim", value);
  };

  // Process data with filters
  const processedData = useMemo(() => {
    if (!data || data.rows.length === 0) {
      return {
        totalLigacoes: 0,
        topColaborador: { name: "--", count: 0 },
        lowestColaborador: { name: "--", count: 0 },
        byColaborador: [],
        byEmpresa: [],
        byDay: [],
        companies: [],
        collaborators: [],
      };
    }

    const { rows, headers } = data;
    
    // Find column indices
    const idxNome = headers.indexOf("Nome");
    const idxData = headers.indexOf("Data");
    const idxEmpresa = headers.indexOf("Empresa");

    // Extract options for filters
    const collaboratorsSet = new Set<string>();
    const companiesMap = new Map<string, string>();

    rows.forEach((row) => {
      const nome = row.Nome?.trim();
      const empresa = row.Empresa?.trim();
      if (nome) collaboratorsSet.add(nome);
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

    const collaborators = Array.from(collaboratorsSet).map((name) => ({
      value: name,
      label: name,
    }));

    // Filter rows
    const filteredRows = rows.filter((row) => {
      const dataStr = row.Data;
      const dataFormatada = parseDate(dataStr);
      const empresaNorm = normalizeText(row.Empresa || "");
      const nome = row.Nome?.trim();

      const dentroPeriodo =
        (!filters.dateStart || dataFormatada >= filters.dateStart) &&
        (!filters.dateEnd || dataFormatada <= filters.dateEnd);
      const empresaOK =
        filters.company === "Todos" || empresaNorm === filters.company;
      const colaboradorOK =
        filters.collaborator === "Todos" || nome === filters.collaborator;

      return dentroPeriodo && empresaOK && colaboradorOK;
    });

    // Count by colaborador
    const colaboradorCount: Record<string, number> = {};
    const empresaCount: Record<string, number> = {};
    const dayCount: Record<string, number> = {};

    filteredRows.forEach((row) => {
      let nome = row.Nome?.trim() || "Sem nome";
      const empresa = row.Empresa?.trim() || "Sem empresa";
      const dataStr = row.Data;
      const dataFormatada = parseDate(dataStr);

      // Rename duplicates
      if (nome === "THIAGO.MAZETTE") nome = "THIAGO (REP)";
      else if (nome === "THIAGO") nome = "THIAGO (DP)";

      colaboradorCount[nome] = (colaboradorCount[nome] || 0) + 1;
      empresaCount[empresa] = (empresaCount[empresa] || 0) + 1;
      if (dataFormatada) dayCount[dataFormatada] = (dayCount[dataFormatada] || 0) + 1;
    });

    // Format for charts
    const byColaborador = Object.entries(colaboradorCount)
      .sort((a, b) => a[1] - b[1]) // ascending order
      .map(([name, value]) => ({ name, value }));

    const byEmpresa = Object.entries(empresaCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    const byDay = Object.entries(dayCount)
      .sort()
      .map(([date, value]) => {
        const [ano, mes, dia] = date.split("-");
        return { date: `${dia}/${mes}`, value, fullDate: date };
      });

    // Find top and lowest
    const sorted = Object.entries(colaboradorCount).sort((a, b) => b[1] - a[1]);
    const topColaborador = sorted[0] ? { name: sorted[0][0], count: sorted[0][1] } : { name: "--", count: 0 };
    const lowFiltered = sorted.filter(([_, count]) => count >= 5);
    const lowestColaborador = lowFiltered.length > 0
      ? { name: lowFiltered[lowFiltered.length - 1][0], count: lowFiltered[lowFiltered.length - 1][1] }
      : { name: "--", count: 0 };

    return {
      totalLigacoes: filteredRows.length,
      topColaborador,
      lowestColaborador,
      byColaborador,
      byEmpresa,
      byDay,
      companies,
      collaborators,
    };
  }, [data, filters]);

  if (!isActive) return null;

  if (isLoading && !data) {
    return <LoadingState message="Carregando ligações..." />;
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters */}
      <FilterBar
        filters={filters}
        options={{
          companies: processedData.companies,
          collaborators: processedData.collaborators,
        }}
        onFilterChange={handleFilterChange}
        onRefresh={loadData}
        isLoading={isLoading}
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Ligações"
          value={processedData.totalLigacoes.toLocaleString("pt-BR")}
          icon={Phone}
          variant="primary"
        />
        <MetricCard
          title="Top Colaborador"
          value={processedData.topColaborador.name}
          subtitle={`${processedData.topColaborador.count} ligações`}
          icon={TrendingUp}
          variant="success"
        />
        <MetricCard
          title="Menor Desempenho"
          value={processedData.lowestColaborador.name}
          subtitle={`${processedData.lowestColaborador.count} ligações`}
          icon={TrendingDown}
          variant="warning"
        />
        <MetricCard
          title="Colaboradores Ativos"
          value={processedData.byColaborador.length}
          icon={Users}
          variant="info"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartContainer
          title="📊 Ligações por Colaborador"
          isLoading={isLoading}
          isEmpty={processedData.byColaborador.length === 0}
        >
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={processedData.byColaborador}>
              <defs>
                <linearGradient id="barGradientLigacoes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip valueLabel="Ligações" />} />
              <Bar dataKey="value" fill="url(#barGradientLigacoes)" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="value" position="top" fill="hsl(var(--foreground))" fontSize={11} fontWeight={600} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="🍕 Distribuição de Ligações"
          isLoading={isLoading}
          isEmpty={processedData.byColaborador.length === 0}
        >
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={processedData.byColaborador}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
              >
                {processedData.byColaborador.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip valueLabel="Ligações" />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartContainer
          title="📈 Ligações por Dia"
          isLoading={isLoading}
          isEmpty={processedData.byDay.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={processedData.byDay}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip valueLabel="Ligações" />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(168, 76%, 42%)"
                strokeWidth={3}
                dot={{ fill: "hsl(168, 76%, 42%)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "hsl(217, 71%, 45%)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="🏢 Ligações por Empresa"
          isLoading={isLoading}
          isEmpty={processedData.byEmpresa.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={processedData.byEmpresa} layout="vertical">
              <defs>
                <linearGradient id="barGradientEmpresa" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 10 }}
                width={100}
              />
              <Tooltip content={<CustomTooltip valueLabel="Ligações" />} />
              <Bar dataKey="value" fill="url(#barGradientEmpresa)" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="value" position="right" fill="hsl(var(--foreground))" fontSize={12} fontWeight={600} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}
