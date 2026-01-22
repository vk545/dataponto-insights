import { Menu, Moon, Sun, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoImage from "@/assets/dataponto-logo.png";
import { AlertBell } from "./AlertBell";
import { SettingsMenu } from "./SettingsMenu";
import { AlertItem } from "@/hooks/useAlertHistory";

interface PlataformaProduct {
  produto: string;
  quantidade: number;
}

interface PlataformaData {
  plataforma: string;
  total: number;
  produtos: PlataformaProduct[];
}

interface HeaderProps {
  activePanel: "contatos" | "ligacoes";
  onPanelChange: (panel: "contatos" | "ligacoes") => void;
  onRefresh: () => void;
  isLoading: boolean;
  isDark: boolean;
  onThemeToggle: () => void;
  alerts: AlertItem[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAlerts: () => void;
  plataformasData?: PlataformaData[];
  dateStart?: string;
  dateEnd?: string;
}

export function Header({
  activePanel,
  onPanelChange,
  onRefresh,
  isLoading,
  isDark,
  onThemeToggle,
  alerts,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAlerts,
  plataformasData = [],
  dateStart = "",
  dateEnd = "",
}: HeaderProps) {
  const panelLabels = {
    contatos: { icon: "📇", label: "Contatos" },
    ligacoes: { icon: "📞", label: "Ligações" },
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-secondary p-0.5">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-card">
              <img
                src={logoImage}
                alt="DATAPONTO"
                className="h-7 w-7 object-contain"
              />
            </div>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold tracking-tight gradient-text">
              DATAPONTO
            </h1>
            <p className="text-xs text-muted-foreground">Dashboard Analytics</p>
          </div>
        </div>

        {/* Navigation Tabs - Desktop */}
        <nav className="hidden md:flex items-center gap-1 rounded-full bg-muted/50 p-1">
          {(Object.keys(panelLabels) as Array<keyof typeof panelLabels>).map(
            (panel) => (
              <button
                key={panel}
                onClick={() => onPanelChange(panel)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  activePanel === panel
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{panelLabels[panel].icon}</span>
                <span>{panelLabels[panel].label}</span>
              </button>
            )
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
            className="relative"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>

          <Button variant="ghost" size="icon" onClick={onThemeToggle}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Alert Bell */}
          <AlertBell
            alerts={alerts}
            unreadCount={unreadCount}
            onMarkAsRead={onMarkAsRead}
            onMarkAllAsRead={onMarkAllAsRead}
            onClear={onClearAlerts}
          />

          {/* Settings Menu (3 dots) */}
          <SettingsMenu 
            plataformasData={plataformasData}
            dateStart={dateStart}
            dateEnd={dateEnd}
          />

          {/* Mobile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {(Object.keys(panelLabels) as Array<keyof typeof panelLabels>).map(
                (panel) => (
                  <DropdownMenuItem
                    key={panel}
                    onClick={() => onPanelChange(panel)}
                    className={activePanel === panel ? "bg-accent" : ""}
                  >
                    <span className="mr-2">{panelLabels[panel].icon}</span>
                    {panelLabels[panel].label}
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
