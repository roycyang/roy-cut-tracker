import { createContext, useContext, useState, useEffect } from 'react';
import * as defaultConfig from '../data/config';

const UserPlanContext = createContext(null);

// Convert hardcoded config into the same shape user_plans will have
function getDefaultPlan() {
  return {
    start_date: defaultConfig.START_DATE,
    end_date: defaultConfig.END_DATE,
    start_weight: defaultConfig.START_WEIGHT,
    goal_weight_min: defaultConfig.GOAL_WEIGHT_MIN,
    goal_weight_max: defaultConfig.GOAL_WEIGHT_MAX,
    eating_window: defaultConfig.EATING_WINDOW,
    weekly_targets: defaultConfig.WEEKLY_TARGETS,
    phase_config: defaultConfig.PHASE_CONFIG,
    training_weeks_1_6: defaultConfig.TRAINING_WEEKS_1_6,
    training_weeks_7_10: defaultConfig.TRAINING_WEEKS_7_10,
    supplements: defaultConfig.SUPPLEMENTS,
    meal_templates: null, // will come from DB for custom plans
    badges: defaultConfig.BADGES,
    xp_values: defaultConfig.XP_VALUES,
    motivation: defaultConfig.MOTIVATION,
    total_weeks: defaultConfig.WEEKLY_TARGETS.length,
  };
}

export function UserPlanProvider({ children }) {
  const [plan, setPlan] = useState(getDefaultPlan);
  const [planLoading, setPlanLoading] = useState(false);

  // Future: load user-specific plan from Supabase user_plans table
  // For now, always use the default hardcoded config
  const loadPlan = async (/* userId */) => {
    setPlanLoading(true);
    try {
      // TODO Phase 1: fetch from supabase
      // const { data } = await supabase.from('user_plans').select('*').eq('user_id', userId).single();
      // if (data) setPlan(normalizePlan(data));
    } finally {
      setPlanLoading(false);
    }
  };

  return (
    <UserPlanContext.Provider value={{ plan, planLoading, loadPlan, setPlan }}>
      {children}
    </UserPlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(UserPlanContext);
  if (!ctx) throw new Error('usePlan must be used inside UserPlanProvider');
  return ctx.plan;
}

export function usePlanContext() {
  const ctx = useContext(UserPlanContext);
  if (!ctx) throw new Error('usePlanContext must be used inside UserPlanProvider');
  return ctx;
}
