import { useState, useMemo, useEffect } from "react";
import { useGoogleSheets, SheetData } from "@/hooks/useGoogleSheets";

interface PlataformaProduct {
  produto: string;
  quantidade: number;
}

interface PlataformaData {
  plataforma: string;
  total: number;
  produtos: PlataformaProduct[];
}

export interface PlataformasResult {
  plataformasData: PlataformaData[];
  isLoading: boolean;
  dateStart: string;
  dateEnd: string;
  refresh: () => Promise<void>;
}

export function usePlataformasData(): PlataformasResult {
  const { isLoading, fetchContatos, parseDate, normalizeText } = useGoogleSheets();
  const [data, setData] = useState<SheetData | null>(null);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  // Load initial dates from localStorage
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const savedStart = localStorage.getItem("filtro_data_inicio_contato");
    const savedEnd = localStorage.getItem("filtro_data_fim_contato");
    
    const shouldResetStart = !savedStart || savedStart < today;
    const shouldResetEnd = !savedEnd || savedEnd < today;
    
    setDateStart(shouldResetStart ? today : savedStart);
    setDateEnd(shouldResetEnd ? today : savedEnd);
  }, []);

  // Listen for filter changes
  useEffect(() => {
    const handleStorageChange = () => {
      const start = localStorage.getItem("filtro_data_inicio_contato") || "";
      const end = localStorage.getItem("filtro_data_fim_contato") || "";
      setDateStart(start);
      setDateEnd(end);
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Also poll for changes since same-tab localStorage changes don't trigger storage event
    const interval = setInterval(handleStorageChange, 1000);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const loadData = async () => {
    try {
      const result = await fetchContatos();
      setData(result);
    } catch (err) {
      console.error("Failed to load contatos for plataformas:", err);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const plataformasData = useMemo<PlataformaData[]>(() => {
    if (!data || data.rows.length === 0) {
      return [];
    }

    const { rows, headers } = data;
    const savedCompany = localStorage.getItem("filtro_empresa_contato") || "Todos";

    // Find column indices
    const idxData = headers.findIndex((h) => h.trim().toLowerCase() === "data");
    const idxEmpresa = headers.findIndex((h) => h.trim().toLowerCase() === "empresa");
    const idxProduto = headers.findIndex((h) => h.trim().toLowerCase() === "produto");
    const idxPlataforma = headers.findIndex((h) => h.trim().toLowerCase() === "plataforma");

    // Filter rows by date and company
    const filteredRows = rows.filter((row) => {
      const dataStr = row[headers[idxData]];
      const dataFormatada = parseDate(dataStr);
      const empresaNorm = normalizeText(row[headers[idxEmpresa]] || "");

      const dentroPeriodo =
        (!dateStart || dataFormatada >= dateStart) &&
        (!dateEnd || dataFormatada <= dateEnd);
      const empresaOK =
        savedCompany === "Todos" || empresaNorm === savedCompany;

      return dentroPeriodo && empresaOK;
    });

    // Group by plataforma -> produtos
    const plataformaMap: Record<string, Record<string, number>> = {};

    filteredRows.forEach((row) => {
      const plataforma = row[headers[idxPlataforma]]?.trim() || "Sem plataforma";
      const produto = row[headers[idxProduto]]?.trim() || "Sem produto";

      if (!plataformaMap[plataforma]) {
        plataformaMap[plataforma] = {};
      }
      plataformaMap[plataforma][produto] = (plataformaMap[plataforma][produto] || 0) + 1;
    });

    // Convert to array format
    return Object.entries(plataformaMap)
      .map(([plataforma, produtos]) => {
        const produtosArr = Object.entries(produtos).map(([produto, quantidade]) => ({
          produto,
          quantidade,
        }));
        return {
          plataforma,
          total: produtosArr.reduce((sum, p) => sum + p.quantidade, 0),
          produtos: produtosArr,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [data, dateStart, dateEnd, parseDate, normalizeText]);

  return {
    plataformasData,
    isLoading,
    dateStart,
    dateEnd,
    refresh: loadData,
  };
}
