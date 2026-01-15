import { useState, useCallback } from "react";

export interface AlertItem {
  id: string;
  type: "warning" | "info" | "success";
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
}

const MAX_ALERTS = 20;

export function useAlertHistory() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const addAlert = useCallback((
    type: AlertItem["type"],
    title: string,
    description: string
  ) => {
    const newAlert: AlertItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      description,
      timestamp: new Date(),
      read: false,
    };

    setAlerts((prev) => [newAlert, ...prev].slice(0, MAX_ALERTS));
  }, []);

  const markAsRead = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setAlerts((prev) => prev.map((alert) => ({ ...alert, read: true })));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const unreadCount = alerts.filter((a) => !a.read).length;

  return {
    alerts,
    addAlert,
    markAsRead,
    markAllAsRead,
    clearAlerts,
    unreadCount,
  };
}
