import { useState } from "react";
import { ArrowRight, ChevronUp, ChevronDown, X } from "lucide-react";

interface IndicadorData {
  vendedor: string;
  indicadores: Record<string, number>;
  total: number;
}

interface IndicacoesDrawerProps {
  data: IndicadorData[];
  indicadores: string[];
}

export function IndicacoesDrawer({ data, indicadores }: IndicacoesDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalGeral = data.reduce((sum, row) => sum + row.total, 0);

  return (
    <>
      {/* Fixed Bottom Bar - Always visible on all devices */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Collapsed Bar */}
        <button
          onClick={() => setIsExpanded(true)}
          className="flex w-full items-center justify-between gap-3 bg-gradient-to-r from-primary to-accent p-4 text-white shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <ArrowRight className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold">Fluxo de Indicações</p>
              <p className="text-xs opacity-80">{totalGeral} contatos indicados</p>
            </div>
          </div>
          <ChevronUp className="h-5 w-5" />
        </button>
      </div>

      {/* Full Screen Drawer - Works on all devices */}
      {isExpanded && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-background animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-primary to-accent p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                <ArrowRight className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Fluxo de Indicações</h2>
                <p className="text-sm opacity-80">Quem indicou contatos para quem</p>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 transition-colors hover:bg-white/30"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            {data.length > 0 ? (
              <div className="space-y-3">
                {data.map((row, index) => (
                  <div
                    key={row.vendedor}
                    className="rounded-xl border border-border bg-card p-4 shadow-sm"
                  >
                    {/* Vendedor Header */}
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-base font-bold text-foreground">
                        🧑‍💼 {row.vendedor}
                      </span>
                      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-accent px-3 text-sm font-bold text-white">
                        {row.total}
                      </span>
                    </div>

                    {/* Indicadores Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {indicadores.map((indicador) => {
                        const count = row.indicadores[indicador] || 0;
                        return (
                          <div
                            key={indicador}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                              count > 0
                                ? "bg-gradient-to-r from-primary/10 to-accent/10"
                                : "bg-muted/30"
                            }`}
                          >
                            <span className="text-xs text-muted-foreground">
                              {indicador}
                            </span>
                            <span
                              className={`text-sm font-bold ${
                                count > 0 ? "text-foreground" : "text-muted-foreground/50"
                              }`}
                            >
                              {count > 0 ? count : "-"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ArrowRight className="mb-3 h-12 w-12 opacity-30" />
                <p className="text-center text-sm">
                  Nenhuma indicação no período selecionado
                </p>
              </div>
            )}
          </div>

          {/* Footer Summary */}
          <div className="border-t border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total de indicações</span>
              <span className="text-xl font-bold text-foreground">{totalGeral}</span>
            </div>
          </div>
        </div>
      )}

      {/* Spacer to prevent content being hidden behind fixed bar */}
      <div className="h-16" />
    </>
  );
}
