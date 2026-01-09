import { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

// Configuration for Google Sheets API
// NOTE: In production, these should be in environment variables
const API_KEY = "AIzaSyDbyuDxEW3HpXvjdTC73XneMNPgTVGtDC4";
const SPREADSHEET_ID_LIGACOES = "16qXfZz08Wk9Hfxt_feiqBPV4tZydV3ruawfcKmy-8L4";
const SPREADSHEET_ID_CONTATOS = "1lfQLKTfpmEgLzfSJQPmBK_2MZSTXBvEJ2R025hbzXiw";
const SPREADSHEET_ID_COMERCIAL = "1XTwDFfedUq0PRDWpZdJkCvYqCxFPGCVdyVuH89wADiE";
const API_KEY_CONTATOS = "AIzaSyCzlwYVb4z5lqZc9Ow0gN4byBCiUGGawGo";

export interface SheetRow {
  [key: string]: string;
}

export interface SheetData {
  headers: string[];
  rows: SheetRow[];
  rawRows: string[][];
}

function normalizeText(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function parseDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes("/")) return "";
  const [dia, mes, ano] = dateStr.split("/");
  return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}

async function fetchSheetData(
  spreadsheetId: string,
  sheetName: string,
  apiKey: string = API_KEY
): Promise<SheetData> {
  const range = encodeURIComponent(`${sheetName}!A:Z`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (!data.values || data.values.length < 2) {
    return { headers: [], rows: [], rawRows: [] };
  }

  const headers = data.values[0] as string[];
  const rawRows = data.values.slice(1) as string[][];
  const rows = rawRows.map((row) => {
    const obj: SheetRow = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx] || "";
    });
    return obj;
  });

  return { headers, rows, rawRows };
}

export function useGoogleSheets() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(() => {
    return localStorage.getItem("ultima_data_atualizacao");
  });

  const fetchLigacoes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSheetData(SPREADSHEET_ID_LIGACOES, "Base");
      const now = new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      setLastUpdated(now);
      localStorage.setItem("ultima_data_atualizacao", now);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar ligações";
      setError(message);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: message,
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchContatos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [recepcaoData, comercialData] = await Promise.all([
        fetchSheetData(SPREADSHEET_ID_CONTATOS, "Contatos", API_KEY_CONTATOS),
        fetchSheetData(SPREADSHEET_ID_COMERCIAL, "COMERCIAL", API_KEY_CONTATOS),
      ]);

      // Merge both data sources
      const headers = recepcaoData.headers.length > 0 ? recepcaoData.headers : comercialData.headers;
      const rows = [...recepcaoData.rows, ...comercialData.rows];
      const rawRows = [...recepcaoData.rawRows, ...comercialData.rawRows];

      const now = new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      setLastUpdated(now);
      localStorage.setItem("ultima_data_atualizacao", now);

      return { headers, rows, rawRows };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar contatos";
      setError(message);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: message,
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPropostas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSheetData(SPREADSHEET_ID_LIGACOES, "Propostas");
      const now = new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      setLastUpdated(now);
      localStorage.setItem("ultima_data_atualizacao", now);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar propostas";
      setError(message);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: message,
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    lastUpdated,
    fetchLigacoes,
    fetchContatos,
    fetchPropostas,
    normalizeText,
    parseDate,
  };
}
