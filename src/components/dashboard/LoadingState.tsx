import { Loader2 } from "lucide-react";

export function LoadingState({ message = "Carregando dados..." }) {
  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full gradient-primary">
          <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{message}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Buscando informações da planilha...
        </p>
      </div>
    </div>
  );
}
