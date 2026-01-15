import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface VendedorData {
  name: string;
  value: number;
}

interface AlertConfig {
  threshold: number;
  alertOnInactive: boolean;
}

interface AlertCallback {
  type: "warning" | "info";
  title: string;
  description: string;
}

const DEFAULT_CONFIG: AlertConfig = {
  threshold: 3,
  alertOnInactive: true,
};

export function useVendedorAlerts(
  vendedores: VendedorData[],
  allVendedoresFromData: string[] = [],
  config: Partial<AlertConfig> = {},
  onAlertGenerated?: (alert: AlertCallback) => void
) {
  const hasShownAlerts = useRef(false);
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  useEffect(() => {
    if (hasShownAlerts.current || vendedores.length === 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      checkAndShowAlerts();
      hasShownAlerts.current = true;
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [vendedores]);

  const checkAndShowAlerts = () => {
    const alerts: AlertCallback[] = [];

    const totalContatos = vendedores.reduce((sum, v) => sum + v.value, 0);
    const media = vendedores.length > 0 ? totalContatos / vendedores.length : 0;

    vendedores.forEach((vendedor) => {
      const diferenca = vendedor.value - media;
      if (diferenca >= mergedConfig.threshold) {
        alerts.push({
          type: "warning",
          title: `⚠️ Desequilíbrio detectado`,
          description: `${vendedor.name} está com ${Math.round(diferenca)} contatos acima da média (${vendedor.value} vs média de ${Math.round(media)})`,
        });
      }
    });

    if (mergedConfig.alertOnInactive && allVendedoresFromData.length > 0) {
      const activeVendedorNames = new Set(vendedores.map((v) => v.name));
      const inactiveVendedores = allVendedoresFromData.filter(
        (name) => !activeVendedorNames.has(name)
      );

      if (inactiveVendedores.length > 0 && inactiveVendedores.length <= 3) {
        inactiveVendedores.forEach((name) => {
          alerts.push({
            type: "info",
            title: `📋 Vendedor sem contatos`,
            description: `${name} não recebeu nenhum contato no período selecionado`,
          });
        });
      } else if (inactiveVendedores.length > 3) {
        alerts.push({
          type: "info",
          title: `📋 Vendedores sem contatos`,
          description: `${inactiveVendedores.length} vendedores não receberam contatos no período`,
        });
      }
    }

    alerts.slice(0, 3).forEach((alert, index) => {
      setTimeout(() => {
        if (alert.type === "warning") {
          toast.warning(alert.title, {
            description: alert.description,
            duration: 8000,
          });
        } else {
          toast.info(alert.title, {
            description: alert.description,
            duration: 6000,
          });
        }
        onAlertGenerated?.(alert);
      }, index * 1000);
    });
  };

  const resetAlerts = () => {
    hasShownAlerts.current = false;
  };

  return { resetAlerts };
}
