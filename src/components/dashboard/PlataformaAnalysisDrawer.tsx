import { useState, useMemo } from "react";
import { BarChart3, GitCompare, Filter, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  Legend,
} from "recharts";
import { CustomTooltip } from "./CustomTooltip";

const COLORS = ["#14b8a6", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#10b981", "#06b6d4", "#f43f5e"];

interface PlataformaProduct {
  produto: string;
  quantidade: number;
}

interface PlataformaData {
  plataforma: string;
  total: number;
  produtos: PlataformaProduct[];
}

interface PlataformaAnalysisDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plataformasData: PlataformaData[];
  dateStart: string;
  dateEnd: string;
}

export function PlataformaAnalysisDrawer({
  open,
  onOpenChange,
  plataformasData,
  dateStart,
  dateEnd,
}: PlataformaAnalysisDrawerProps) {
  const [activeTab, setActiveTab] = useState("filtro");
  const [selectedPlataforma, setSelectedPlataforma] = useState<string>("");
  const [comparePlataforma1, setComparePlataforma1] = useState<string>("");
  const [comparePlataforma2, setComparePlataforma2] = useState<string>("");

  const plataformas = useMemo(() => {
    return plataformasData.map((p) => p.plataforma).sort();
  }, [plataformasData]);

  const selectedPlataformaData = useMemo(() => {
    if (!selectedPlataforma) return null;
    return plataformasData.find((p) => p.plataforma === selectedPlataforma);
  }, [selectedPlataforma, plataformasData]);

  const comparisonData = useMemo(() => {
    if (!comparePlataforma1 || !comparePlataforma2) return null;

    const p1 = plataformasData.find((p) => p.plataforma === comparePlataforma1);
    const p2 = plataformasData.find((p) => p.plataforma === comparePlataforma2);

    if (!p1 || !p2) return null;

    // Get all unique products
    const allProducts = new Set<string>();
    p1.produtos.forEach((prod) => allProducts.add(prod.produto));
    p2.produtos.forEach((prod) => allProducts.add(prod.produto));

    // Build comparison data
    const comparison = Array.from(allProducts).map((produto) => {
      const q1 = p1.produtos.find((pr) => pr.produto === produto)?.quantidade || 0;
      const q2 = p2.produtos.find((pr) => pr.produto === produto)?.quantidade || 0;
      return {
        produto,
        [comparePlataforma1]: q1,
        [comparePlataforma2]: q2,
      };
    });

    return {
      comparison,
      totals: {
        [comparePlataforma1]: p1.total,
        [comparePlataforma2]: p2.total,
      },
    };
  }, [comparePlataforma1, comparePlataforma2, plataformasData]);

  const formatPeriod = () => {
    if (!dateStart || !dateEnd) return "Período atual";
    const [anoStart, mesStart, diaStart] = dateStart.split("-");
    const [anoEnd, mesEnd, diaEnd] = dateEnd.split("-");
    if (dateStart === dateEnd) {
      return `${diaStart}/${mesStart}/${anoStart}`;
    }
    return `${diaStart}/${mesStart} a ${diaEnd}/${mesEnd}/${anoEnd}`;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b border-border pb-4">
          <DrawerTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Análise de Plataformas
          </DrawerTitle>
          <DrawerDescription>
            Período: <Badge variant="outline">{formatPeriod()}</Badge>
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="filtro" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Por Plataforma
              </TabsTrigger>
              <TabsTrigger value="comparar" className="flex items-center gap-2">
                <GitCompare className="h-4 w-4" />
                Comparar
              </TabsTrigger>
            </TabsList>

            {/* Tab: Filter by Platform */}
            <TabsContent value="filtro" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Selecione uma plataforma
                </label>
                <Select value={selectedPlataforma} onValueChange={setSelectedPlataforma}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Escolha uma plataforma..." />
                  </SelectTrigger>
                  <SelectContent>
                    {plataformas.map((plat) => (
                      <SelectItem key={plat} value={plat}>
                        {plat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPlataformaData && (
                <div className="space-y-4 mt-4 animate-fade-in">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Total de contatos:</span>
                    <Badge variant="default" className="text-lg">
                      {selectedPlataformaData.total}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      Produtos por {selectedPlataforma}
                    </h4>
                    
                    {selectedPlataformaData.produtos.length > 0 ? (
                      <>
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={selectedPlataformaData.produtos.sort((a, b) => b.quantidade - a.quantidade)}
                              layout="vertical"
                            >
                              <defs>
                                <linearGradient id="colorGradientPlat" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#14b8a6" />
                                  <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                              <XAxis type="number" tick={{ fontSize: 12 }} />
                              <YAxis
                                dataKey="produto"
                                type="category"
                                tick={{ fontSize: 11 }}
                                width={100}
                              />
                              <Tooltip content={<CustomTooltip valueLabel="Quantidade" />} />
                              <Bar dataKey="quantidade" fill="url(#colorGradientPlat)" radius={[0, 4, 4, 0]}>
                                <LabelList dataKey="quantidade" position="right" fill="hsl(var(--foreground))" fontSize={12} fontWeight={600} />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-4">
                          {selectedPlataformaData.produtos
                            .sort((a, b) => b.quantidade - a.quantidade)
                            .map((prod, idx) => (
                              <div
                                key={prod.produto}
                                className="flex items-center justify-between p-2 bg-card border border-border rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                  />
                                  <span className="text-sm truncate">{prod.produto}</span>
                                </div>
                                <Badge variant="secondary">{prod.quantidade}</Badge>
                              </div>
                            ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum produto encontrado para esta plataforma
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!selectedPlataforma && (
                <div className="text-center py-12 text-muted-foreground">
                  <Filter className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Selecione uma plataforma para ver os produtos</p>
                </div>
              )}
            </TabsContent>

            {/* Tab: Compare Platforms */}
            <TabsContent value="comparar" className="space-y-4">
              <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Plataforma 1
                  </label>
                  <Select value={comparePlataforma1} onValueChange={setComparePlataforma1}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha..." />
                    </SelectTrigger>
                    <SelectContent>
                      {plataformas.map((plat) => (
                        <SelectItem key={plat} value={plat} disabled={plat === comparePlataforma2}>
                          {plat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-center pb-1">
                  <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90 sm:rotate-0" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Plataforma 2
                  </label>
                  <Select value={comparePlataforma2} onValueChange={setComparePlataforma2}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha..." />
                    </SelectTrigger>
                    <SelectContent>
                      {plataformas.map((plat) => (
                        <SelectItem key={plat} value={plat} disabled={plat === comparePlataforma1}>
                          {plat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {comparisonData && (
                <div className="space-y-4 mt-4 animate-fade-in">
                  {/* Totals comparison */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-primary/10 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">{comparePlataforma1}</p>
                      <p className="text-2xl font-bold text-primary">
                        {comparisonData.totals[comparePlataforma1]}
                      </p>
                      <p className="text-xs text-muted-foreground">contatos</p>
                    </div>
                    <div className="p-4 bg-secondary/30 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">{comparePlataforma2}</p>
                      <p className="text-2xl font-bold text-secondary-foreground">
                        {comparisonData.totals[comparePlataforma2]}
                      </p>
                      <p className="text-xs text-muted-foreground">contatos</p>
                    </div>
                  </div>

                  {/* Difference indicator */}
                  {(() => {
                    const t1 = comparisonData.totals[comparePlataforma1];
                    const t2 = comparisonData.totals[comparePlataforma2];
                    const diff = t1 - t2;
                    const percentDiff = t2 > 0 ? ((diff / t2) * 100).toFixed(1) : "∞";
                    const winner = diff > 0 ? comparePlataforma1 : diff < 0 ? comparePlataforma2 : null;
                    
                    return (
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        {winner ? (
                          <p className="text-sm">
                            <span className="font-semibold">{winner}</span> tem{" "}
                            <Badge variant={diff > 0 ? "default" : "secondary"}>
                              {Math.abs(diff)} ({Math.abs(Number(percentDiff))}%)
                            </Badge>{" "}
                            {Math.abs(diff) === 1 ? "contato" : "contatos"} a mais
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Ambas plataformas estão empatadas</p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Products comparison chart */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      Comparação por Produto
                    </h4>
                    
                    {comparisonData.comparison.length > 0 ? (
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={comparisonData.comparison} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis type="number" tick={{ fontSize: 12 }} />
                            <YAxis
                              dataKey="produto"
                              type="category"
                              tick={{ fontSize: 11 }}
                              width={90}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--popover))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                            />
                            <Legend />
                            <Bar dataKey={comparePlataforma1} fill="#14b8a6" radius={[0, 4, 4, 0]} />
                            <Bar dataKey={comparePlataforma2} fill="#3b82f6" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum produto para comparar
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(!comparePlataforma1 || !comparePlataforma2) && (
                <div className="text-center py-12 text-muted-foreground">
                  <GitCompare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Selecione duas plataformas para comparar</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
