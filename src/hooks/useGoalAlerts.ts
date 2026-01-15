import { useEffect, useRef } from "react";
import { toast } from "sonner";

const GOAL_STORAGE_KEY = "dataponto_contact_goal";
const GOAL_ACHIEVED_KEY = "dataponto_goal_achieved";

export interface GoalConfig {
  target: number;
  enabled: boolean;
}

const DEFAULT_GOAL: GoalConfig = {
  target: 15,
  enabled: true,
};

export function getStoredGoal(): GoalConfig {
  try {
    const stored = localStorage.getItem(GOAL_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error reading goal from storage:", e);
  }
  return DEFAULT_GOAL;
}

export function saveGoal(goal: GoalConfig): void {
  try {
    localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(goal));
  } catch (e) {
    console.error("Error saving goal:", e);
  }
}

function getAchievedKey(target: number, period: string): string {
  return `${GOAL_ACHIEVED_KEY}_${target}_${period}`;
}

function hasGoalBeenAchieved(target: number, period: string): boolean {
  try {
    return localStorage.getItem(getAchievedKey(target, period)) === "true";
  } catch {
    return false;
  }
}

function markGoalAchieved(target: number, period: string): void {
  try {
    localStorage.setItem(getAchievedKey(target, period), "true");
  } catch (e) {
    console.error("Error marking goal achieved:", e);
  }
}

export function useGoalAlerts(
  totalContatos: number,
  periodIdentifier: string
) {
  const hasChecked = useRef(false);
  const goal = getStoredGoal();

  useEffect(() => {
    if (!goal.enabled || totalContatos === 0 || hasChecked.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (totalContatos >= goal.target) {
        // Check if we already notified for this goal+period combo
        if (!hasGoalBeenAchieved(goal.target, periodIdentifier)) {
          toast.success("🎯 Meta atingida!", {
            description: `Parabéns! A meta de ${goal.target} contatos foi alcançada (${totalContatos} contatos no período)`,
            duration: 10000,
          });
          markGoalAchieved(goal.target, periodIdentifier);
        }
      }
      hasChecked.current = true;
    }, 2500);

    return () => clearTimeout(timeoutId);
  }, [totalContatos, goal.target, goal.enabled, periodIdentifier]);

  // Reset when period changes
  useEffect(() => {
    hasChecked.current = false;
  }, [periodIdentifier]);

  return { goal };
}
