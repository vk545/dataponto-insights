import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/dashboard/Header";
import { ContatosPanel } from "@/components/panels/ContatosPanel";
import { LigacoesPanel } from "@/components/panels/LigacoesPanel";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { useAlertHistory } from "@/hooks/useAlertHistory";
import { usePlataformasData } from "@/hooks/usePlataformasData";

type PanelType = "contatos" | "ligacoes";

export default function Dashboard() {
  const [activePanel, setActivePanel] = useState<PanelType>("contatos");
  const [isDark, setIsDark] = useState(false);
  const { isLoading, lastUpdated, fetchContatos, fetchLigacoes } = useGoogleSheets();
  const {
    alerts,
    addAlert,
    markAsRead,
    markAllAsRead,
    clearAlerts,
    unreadCount,
  } = useAlertHistory();
  const { plataformasData, dateStart, dateEnd, refresh: refreshPlataformas } = usePlataformasData();

  // Check for system dark mode preference
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleRefresh = () => {
    switch (activePanel) {
      case "contatos":
        fetchContatos();
        refreshPlataformas();
        break;
      case "ligacoes":
        fetchLigacoes();
        break;
    }
  };

  const handleAlertGenerated = useCallback(
    (alert: { type: "warning" | "info" | "success"; title: string; description: string }) => {
      addAlert(alert.type, alert.title, alert.description);
    },
    [addAlert]
  );

  const panelTitles = {
    contatos: "📇 Painel de Contatos",
    ligacoes: "📞 Painel de Ligações",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        isDark={isDark}
        onThemeToggle={handleThemeToggle}
        alerts={alerts}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onClearAlerts={clearAlerts}
        plataformasData={plataformasData}
        dateStart={dateStart}
        dateEnd={dateEnd}
      />

      <main className="container py-6">
        {/* Page Title */}
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {panelTitles[activePanel]}
          </h2>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              🔄 Atualizado em: {lastUpdated}
            </p>
          )}
        </div>

        {/* Panel Content */}
        <ContatosPanel isActive={activePanel === "contatos"} onAlertGenerated={handleAlertGenerated} />
        <LigacoesPanel isActive={activePanel === "ligacoes"} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DATAPONTO. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-success" />
            <span className="text-xs text-muted-foreground">
              Conectado ao Google Sheets
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
