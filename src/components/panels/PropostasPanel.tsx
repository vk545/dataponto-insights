import { useState, useEffect, useMemo } from "react";
import { FileText, CheckCircle, XCircle, Clock, TrendingUp, UserX } from "lucide-react";
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

const COLORS = ["#14b8a6", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#10b981", "#ef4444", "#06b6d4"];
const STATUS_COLORS = {
  ganhas: "#10b981",
  perdidas: "#ef4444",
  abertas: "#f59e0b",
};

interface PropostasPanelProps {
  isActive: boolean;
}

export function PropostasPanel({ isActive }: PropostasPanelProps) {
  const { isLoading, error, fetchPropostas, parseDate, normalizeText } = useGoogleSheets();
  const [data, setData] = useState<SheetData | null>(null);
  const [filters, setFilters] = useState(() => {
    const today = new Date().toISOString().split("T")[0];
    return {
      dateStart: today,
      dateEnd: today,
      company: "Todos",
      seller: "",
      product: "",
    };
  });

  // Load data when panel becomes active
  useEffect(() => {
    if (isActive && !data) {
      loadData();
    }
  }, [isActive]);

  const loadData = async () => {
    try {
      const result = await fetchPropostas();
      setData(result);
    } catch (err) {
      console.error("Failed to load propostas:", err);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Process data with filters
  const processedData = useMemo(() => {
    if (!data || data.rows.length === 0) {
      return {
        total: 0,
        ganhas: 0,
        perdidas: 0,
        abertas: 0,
        naoRetorno: 0,
        conversao: "0%",
        byStatus: [],
        byResponsavel: [],
        byMotivo: [],
        sellers: [],
        products: [],
        companies: [],
      };
    }

    const { rows, headers } = data;
    
    // Find column indices
    const idxStatus = headers.findIndex((h) => normalizeText(h).includes("status"));
    const idxResponsavel = headers.findIndex(
      (h) => normalizeText(h).includes("responsavel") || normalizeText(h).includes("vendedor")
    );
    const idxProduto = headers.findIndex((h) => normalizeText(h).includes("produto"));
    const idxMotivo = headers.findIndex((h) => normalizeText(h).includes("motivo"));
    const idxData = headers.findIndex((h) => normalizeText(h).includes("data"));

    // Extract options for filters
    const sellersSet = new Set<string>();
    const productsSet = new Set<string>();

    rows.forEach((row) => {
      const responsavel = row[headers[idxResponsavel]]?.trim();
      const produto = row[headers[idxProduto]]?.trim();
      if (responsavel) sellersSet.add(responsavel);
      if (produto) productsSet.add(produto);
    });

    const sellers = Array.from(sellersSet).map((name) => ({ value: name, label: name }));
    const products = Array.from(productsSet).map((name) => ({ value: name, label: name }));

    // Filter rows
    const filteredRows = rows.filter((row) => {
      const dataStr = row[headers[idxData]];
      const dataFormatada = parseDate(dataStr);
      const responsavel = row[headers[idxResponsavel]]?.trim() || "";
      const produto = row[headers[idxProduto]]?.trim() || "";

      const dentroPeriodo =
        (!filters.dateStart || dataFormatada >= filters.dateStart) &&
        (!filters.dateEnd || dataFormatada <= filters.dateEnd);
      const sellerOK = !filters.seller || responsavel === filters.seller;
      const productOK = !filters.product || produto === filters.product;

      return dentroPeriodo && sellerOK && productOK;
    });

    // Count by status
    let ganhas = 0;
    let perdidas = 0;
    let abertas = 0;
    let naoRetorno = 0;

    const statusCount: Record<string, number> = {};
    const responsavelCount: Record<string, number> = {};
    const motivoCount: Record<string, number> = {};

    filteredRows.forEach((row) => {
      const statusRaw = row[headers[idxStatus]]?.trim() || "Sem status";
      const statusNorm = normalizeText(statusRaw);
      const responsavel = row[headers[idxResponsavel]]?.trim() || "Sem responsável";
      const motivo = row[headers[idxMotivo]]?.trim();

      statusCount[statusRaw] = (statusCount[statusRaw] || 0) + 1;
      responsavelCount[responsavel] = (responsavelCount[responsavel] || 0) + 1;

      // Classify by status
      if (
        statusNorm === "vendido" ||
        statusNorm === "produtovendido" ||
        statusNorm === "fechou"
      ) {
        ganhas++;
      } else if (
        statusNorm === "naovendido" ||
        statusNorm === "perdido" ||
        statusNorm === "cancelado"
      ) {
        perdidas++;
        if (motivo) {
          motivoCount[motivo] = (motivoCount[motivo] || 0) + 1;
        }
      } else if (
        statusNorm === "semretorno" ||
        statusNorm === "conversando" ||
        statusNorm === "analise"
      ) {
        abertas++;
      }

      if (statusNorm === "vendedornaoretornou") {
        naoRetorno++;
        abertas++;
      }
    });

    const total = filteredRows.length;
    const conversao = total > 0 ? ((ganhas / total) * 100).toFixed(1) + "%" : "0%";

    // Format for charts
    const byStatus = [
      { name: "Ganhas", value: ganhas },
      { name: "Perdidas", value: perdidas },
      { name: "Em Aberto", value: abertas },
    ];

    const byResponsavel = Object.entries(responsavelCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    const byMotivo = Object.entries(motivoCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));

    return {
      total,
      ganhas,
      perdidas,
      abertas,
      naoRetorno,
      conversao,
      byStatus,
      byResponsavel,
      byMotivo,
      sellers,
      products,
      companies: [],
    };
  }, [data, filters]);

  if (!isActive) return null;

  if (isLoading && !data) {
    return <LoadingState message="Carregando propostas..." />;
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
          sellers: processedData.sellers,
          products: processedData.products,
        }}
        onFilterChange={handleFilterChange}
        onRefresh={loadData}
        isLoading={isLoading}
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          title="Total"
          value={processedData.total.toLocaleString("pt-BR")}
          icon={FileText}
          variant="primary"
        />
        <MetricCard
          title="Em Aberto"
          value={processedData.abertas.toLocaleString("pt-BR")}
          icon={Clock}
          variant="warning"
        />
        <MetricCard
          title="Ganhas"
          value={processedData.ganhas.toLocaleString("pt-BR")}
          icon={CheckCircle}
          variant="success"
        />
        <MetricCard
          title="Perdidas"
          value={processedData.perdidas.toLocaleString("pt-BR")}
          icon={XCircle}
          variant="destructive"
        />
        <MetricCard
          title="Conversão"
          value={processedData.conversao}
          icon={TrendingUp}
          variant="info"
        />
        <MetricCard
          title="Sem Retorno"
          value={processedData.naoRetorno.toLocaleString("pt-BR")}
          icon={UserX}
          variant="default"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartContainer
          title="📊 Status das Propostas"
          isLoading={isLoading}
          isEmpty={processedData.byStatus.every((s) => s.value === 0)}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={processedData.byStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
              >
                <Cell fill={STATUS_COLORS.ganhas} />
                <Cell fill={STATUS_COLORS.perdidas} />
                <Cell fill={STATUS_COLORS.abertas} />
              </Pie>
              <Tooltip content={<PieTooltip valueLabel="Propostas" />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="👤 Propostas por Responsável"
          isLoading={isLoading}
          isEmpty={processedData.byResponsavel.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={processedData.byResponsavel}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip valueLabel="Propostas" />} />
              <Bar dataKey="value" fill="hsl(217, 71%, 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Loss Reasons Chart */}
      {processedData.byMotivo.length > 0 && (
        <ChartContainer
          title="❌ Motivos de Perda"
          isLoading={isLoading}
          isEmpty={processedData.byMotivo.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={processedData.byMotivo}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) =>
                  `${name.substring(0, 15)}... (${(percent * 100).toFixed(0)}%)`
                }
              >
                {processedData.byMotivo.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip valueLabel="Perdas" />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}
    </div>
  );
}
