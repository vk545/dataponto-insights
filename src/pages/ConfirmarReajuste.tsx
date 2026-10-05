import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export default function ConfirmarReajuste() {
  const [params] = useSearchParams();
  const lote = params.get("lote") || "";
  const email = params.get("email") || "";
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  const confirmar = async () => {
    setState("loading");
    const { data, error } = await supabase.functions.invoke("reajustes", { body: { action: "confirm", lote, email } });
    if (error) { setState("error"); setMsg("Não foi possível confirmar. Tente novamente."); return; }
    setState("ok");
    setMsg(data?.already ? "Este reajuste já estava confirmado." : "Recebimento confirmado. Obrigado!");
  };

  useEffect(() => { if (!lote) { setState("error"); setMsg("Link inválido."); } }, [lote]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold gradient-text">DATAPONTO</h1>
        <p className="text-lg">Confirmação de reajuste de preços</p>
        {state === "idle" && (
          <Button className="w-full h-12 text-base" onClick={confirmar}>Confirmar recebimento</Button>
        )}
        {state === "loading" && <p className="text-muted-foreground">Confirmando...</p>}
        {(state === "ok" || state === "error") && <p className="text-lg font-semibold">{msg}</p>}
      </div>
    </div>
  );
}
