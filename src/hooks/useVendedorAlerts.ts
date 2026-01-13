import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface VendedorData {
  name: string;
  value: number;
}

interface AlertConfig {
  threshold: number; // Diferença mínima acima da média para gerar alerta
  alertOnInactive: boolean; // Alertar sobre vendedores sem contatos
}

const DEFAULT_CONFIG: AlertConfig = {
  threshold: 3,
  alertOnInactive: true,
};

export function useVendedorAlerts(
  vendedores: VendedorData[],
  allVendedoresFromData: string[] = [],
  config: Partial<AlertConfig> = {}
) {
  const hasShownAlerts = useRef(false);
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  useEffect(() => {
    // Only show alerts once per data load, and only if we have data
    if (hasShownAlerts.current || vendedores.length === 0) {
      return;
    }

    // Small delay to ensure page is loaded
    const timeoutId = setTimeout(() => {
      checkAndShowAlerts();
      hasShownAlerts.current = true;
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [vendedores]);

  const checkAndShowAlerts = () => {
    const alerts: { type: "warning" | "info"; message: string; description: string }[] = [];

    // Calculate average contacts per active vendedor
    const totalContatos = vendedores.reduce((sum, v) => sum + v.value, 0);
    const media = vendedores.length > 0 ? totalContatos / vendedores.length : 0;

    // Check for vendedores above threshold
    vendedores.forEach((vendedor) => {
      const diferenca = vendedor.value - media;
      if (diferenca >= mergedConfig.threshold) {
        alerts.push({
          type: "warning",
          message: `⚠️ Desequilíbrio detectado`,
          description: `${vendedor.name} está com ${Math.round(diferenca)} contatos acima da média (${vendedor.value} vs média de ${Math.round(media)})`,
        });
      }
    });

    // Check for inactive vendedores (if we have a full list to compare)
    if (mergedConfig.alertOnInactive && allVendedoresFromData.length > 0) {
      const activeVendedorNames = new Set(vendedores.map((v) => v.name));
      const inactiveVendedores = allVendedoresFromData.filter(
        (name) => !activeVendedorNames.has(name)
      );

      if (inactiveVendedores.length > 0 && inactiveVendedores.length <= 3) {
        inactiveVendedores.forEach((name) => {
          alerts.push({
            type: "info",
            message: `📋 Vendedor sem contatos`,
            description: `${name} não recebeu nenhum contato no período selecionado`,
          });
        });
      } else if (inactiveVendedores.length > 3) {
        alerts.push({
          type: "info",
          message: `📋 Vendedores sem contatos`,
          description: `${inactiveVendedores.length} vendedores não receberam contatos no período`,
        });
      }
    }

    // Show alerts with staggered timing
    alerts.slice(0, 3).forEach((alert, index) => {
      setTimeout(() => {
        if (alert.type === "warning") {
          toast.warning(alert.message, {
            description: alert.description,
            duration: 8000,
          });
        } else {
          toast.info(alert.message, {
            description: alert.description,
            duration: 6000,
          });
        }
      }, index * 1000);
    });
  };

  // Reset when data changes significantly
  const resetAlerts = () => {
    hasShownAlerts.current = false;
  };

  return { resetAlerts };
}
