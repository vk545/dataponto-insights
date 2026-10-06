import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, ExternalLink, RefreshCw, Check, Mail } from "lucide-react";
import { toast } from "sonner";

interface Item { codigo: string; nome: string; tipo: string; valor: number }
interface Reajuste {
  row: number; lote: string; codigo: string; item: string; anterior: number; novo: number;
  percentual: string; data: string; vigencia: string; status: string; comunicado: string;
  recebidoPor: string; recebidoEm: string; implantadoEm: string;
}
interface Data { itens: Item[]; reajustes: Reajuste[]; destinatarios: string[]; sheetUrl: string }

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function call(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("reajustes", { body });
  if (error) {
    let msg = error.message;
    try { msg = (await (error as any).context.json()).error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return data;
}

function statusVariant(s: string) {
  if (s === "Implantado") return "default" as const;
  if (s === "Recebido") return "secondary" as const;
  return "outline" as const;
}

export function ReajustesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [modo, setModo] = useState<"percentual" | "fixo">("percentual");
  const [valor, setValor] = useState("");
  const [vigencia, setVigencia] = useState(() => new Date().toISOString().slice(0, 10));
  const [obs, setObs] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const d = await call({ action: "list" });
      setData(d);
    } catch (e: any) {
      toast.error(e.message);
      setData(null);
    } finally { setLoading(false); }
  };

  const v = Number(valor.replace(",", "."));
  const preview = (ant: number) => (modo === "fixo" ? ant + v : ant * (1 + v / 100));

  const criar = async () => {
    if (!selected.length || !v) return toast.error("Escolha os itens e informe o reajuste");
    setLoading(true);
    try {
      const [y, m, d] = vigencia.split("-");
      const r = await call({ action: "create", codigos: selected, modo, valor: v, vigencia: `${d}/${m}/${y}`, obs, origin: window.location.origin });
      toast.success(`Reajuste gravado (${r.itens} item(ns))`, { description: `Aviso para: ${r.destinatarios}` });
      setSelected([]); setValor(""); setObs("");
      await load();
    } catch (e: any) { toast.error(e.message); setLoading(false); }
  };

  const implantar = async (row: number) => {
    setLoading(true);
    try { await call({ action: "implant", row }); toast.success("Marcado como implantado"); await load(); }
    catch (e: any) { toast.error(e.message); setLoading(false); }
  };

  useEffect(() => { if (open && !data) load(); }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">📋 Controle de Reajustes de Preços</DialogTitle>
          <DialogDescription>Crie e acompanhe reajustes com aviso por e-mail.</DialogDescription>
        </DialogHeader>

        {!data ? (
          <p className="py-8 text-center text-muted-foreground">{loading ? "Carregando..." : "Não foi possível carregar."}</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-4 w-4" /> Avisos para: <strong className="text-foreground">{data.destinatarios.join(", ") || "—"}</strong>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Atualizar
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={data.sheetUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-1" /> Planilha</a>
                </Button>
              </div>
            </div>

            <Tabs defaultValue="novo">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="novo">Novo reajuste</TabsTrigger>
                <TabsTrigger value="historico">Histórico ({data.reajustes.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="novo" className="space-y-4">
                <div className="rounded-xl border border-border divide-y divide-border">
                  {data.itens.map((it) => {
                    const on = selected.includes(it.codigo);
                    return (
                      <label key={it.codigo} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50">
                        <Checkbox checked={on} onCheckedChange={(c) => setSelected((s) => c ? [...s, it.codigo] : s.filter((x) => x !== it.codigo))} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{it.nome}</p>
                          <p className="text-xs text-muted-foreground">{it.codigo} · {it.tipo}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{brl(it.valor)}</p>
                          {on && v ? <p className="text-xs text-success font-semibold">→ {brl(preview(it.valor))}</p> : null}
                        </div>
                      </label>
                    );
                  })}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelected(selected.length === data.itens.length ? [] : data.itens.map((i) => i.codigo))}>
                  {selected.length === data.itens.length ? "Desmarcar todos" : "Selecionar todos"}
                </Button>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Tipo de aumento</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant={modo === "percentual" ? "default" : "outline"} className="flex-1" onClick={() => setModo("percentual")}>Percentual (%)</Button>
                      <Button type="button" variant={modo === "fixo" ? "default" : "outline"} className="flex-1" onClick={() => setModo("fixo")}>Valor fixo (R$)</Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>{modo === "percentual" ? "Percentual" : "Valor do aumento"}</Label>
                    <Input inputMode="decimal" placeholder={modo === "percentual" ? "ex.: 5" : "ex.: 50"} value={valor} onChange={(e) => setValor(e.target.value)} className="h-10 text-lg" />
                  </div>
                  <div className="space-y-1">
                    <Label>Vigência</Label>
                    <Input type="date" value={vigencia} onChange={(e) => setVigencia(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Observação</Label>
                    <Input value={obs} maxLength={500} onChange={(e) => setObs(e.target.value)} />
                  </div>
                </div>
                <Button className="w-full h-12 text-base" onClick={criar} disabled={loading || !selected.length || !v}>
                  Gravar e avisar ({selected.length} item{selected.length === 1 ? "" : "s"})
                </Button>
              </TabsContent>

              <TabsContent value="historico" className="space-y-2">
                {data.reajustes.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">Nenhum reajuste ainda.</p>}
                {data.reajustes.map((r) => (
                  <div key={r.row} className="rounded-xl border border-border p-3 flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[180px]">
                      <p className="font-medium">{r.item} <span className="text-xs text-muted-foreground">({r.codigo})</span></p>
                      <p className="text-sm">{brl(r.anterior)} → <strong>{brl(r.novo)}</strong> <span className="text-muted-foreground">({r.percentual})</span></p>
                      <p className="text-xs text-muted-foreground">Pedido {r.data} · Vigência {r.vigencia}</p>
                      {r.recebidoEm && <p className="text-xs text-muted-foreground">Recebido por {r.recebidoPor} em {r.recebidoEm}</p>}
                      {r.implantadoEm && <p className="text-xs text-muted-foreground">Implantado em {r.implantadoEm}</p>}
                    </div>
                    <Badge variant={statusVariant(r.status)}>{r.status || "—"}</Badge>
                    {r.status !== "Implantado" && (
                      <Button size="sm" onClick={() => implantar(r.row)} disabled={loading}>
                        <Check className="h-4 w-4 mr-1" /> Marcar implantado
                      </Button>
                    )}
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
