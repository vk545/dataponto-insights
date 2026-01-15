import { Bell, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertItem } from "@/hooks/useAlertHistory";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AlertBellProps {
  alerts: AlertItem[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClear: () => void;
}

export function AlertBell({
  alerts,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClear,
}: AlertBellProps) {
  const getAlertIcon = (type: AlertItem["type"]) => {
    switch (type) {
      case "warning":
        return "⚠️";
      case "success":
        return "🎯";
      case "info":
      default:
        return "📋";
    }
  };

  const getAlertColor = (type: AlertItem["type"]) => {
    switch (type) {
      case "warning":
        return "border-l-warning";
      case "success":
        return "border-l-success";
      case "info":
      default:
        return "border-l-primary";
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border p-3">
          <h4 className="font-semibold text-sm">Notificações</h4>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="h-7 px-2 text-xs"
              >
                <Check className="mr-1 h-3 w-3" />
                Marcar lidas
              </Button>
            )}
            {alerts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-80">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="mb-2 h-8 w-8 opacity-20" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {alerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => onMarkAsRead(alert.id)}
                  className={`w-full text-left p-3 transition-colors hover:bg-muted/50 border-l-4 ${getAlertColor(
                    alert.type
                  )} ${!alert.read ? "bg-muted/30" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm">{getAlertIcon(alert.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!alert.read ? "font-medium" : ""}`}>
                        {alert.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {alert.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(alert.timestamp, {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    {!alert.read && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
