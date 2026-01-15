import { useState, useEffect } from "react";
import { MoreVertical, Target, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getStoredGoal, saveGoal, GoalConfig } from "@/hooks/useGoalAlerts";
import { toast } from "sonner";

export function SettingsMenu() {
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [goalConfig, setGoalConfig] = useState<GoalConfig>(getStoredGoal());

  useEffect(() => {
    setGoalConfig(getStoredGoal());
  }, [isGoalDialogOpen]);

  const handleSaveGoal = () => {
    if (goalConfig.target < 1) {
      toast.error("A meta deve ser pelo menos 1 contato");
      return;
    }
    saveGoal(goalConfig);
    setIsGoalDialogOpen(false);
    toast.success("Meta salva com sucesso!", {
      description: goalConfig.enabled
        ? `Meta definida: ${goalConfig.target} contatos`
        : "Meta desativada",
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Configurações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsGoalDialogOpen(true)}>
            <Target className="mr-2 h-4 w-4" />
            Configurar Meta
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Configurar Meta de Contatos
            </DialogTitle>
            <DialogDescription>
              Defina uma meta para o total de contatos. Você receberá uma
              notificação quando a meta for atingida no período selecionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="goal-enabled" className="text-sm font-medium">
                Ativar notificação de meta
              </Label>
              <Switch
                id="goal-enabled"
                checked={goalConfig.enabled}
                onCheckedChange={(enabled) =>
                  setGoalConfig((prev) => ({ ...prev, enabled }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-target">Meta de contatos</Label>
              <Input
                id="goal-target"
                type="number"
                min={1}
                max={1000}
                value={goalConfig.target}
                onChange={(e) =>
                  setGoalConfig((prev) => ({
                    ...prev,
                    target: parseInt(e.target.value) || 1,
                  }))
                }
                disabled={!goalConfig.enabled}
                className="text-lg font-semibold"
              />
              <p className="text-xs text-muted-foreground">
                Sugestões comuns: 10, 15, 20, 30, 50 contatos
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              {[10, 15, 20, 30, 50].map((value) => (
                <Button
                  key={value}
                  variant={goalConfig.target === value ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setGoalConfig((prev) => ({ ...prev, target: value }))
                  }
                  disabled={!goalConfig.enabled}
                  className="text-xs"
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGoalDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveGoal}>
              <Check className="mr-2 h-4 w-4" />
              Salvar Meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
