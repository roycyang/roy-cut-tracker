import { useCallback } from 'react';
import { useData } from '../context/DataContext';
import { supabase } from '../utils/supabase';

export function useStorage() {
  const { dailyLogs, userState, upsertDailyLog, updateUserState } = useData();

  // ── Weights ──
  const getWeights = useCallback(() => {
    const result = {};
    for (const [key, log] of Object.entries(dailyLogs)) {
      if (log.weight != null) result[key] = log.weight;
    }
    return result;
  }, [dailyLogs]);

  const getWeightForDate = useCallback((dateKey) => {
    return dailyLogs[dateKey]?.weight ?? null;
  }, [dailyLogs]);

  const logWeight = useCallback((dateKey, weight) => {
    upsertDailyLog(dateKey, { weight });
  }, [upsertDailyLog]);

  // ── Meals ──
  const getMealChecks = useCallback((dateKey) => {
    return dailyLogs[dateKey]?.meals || {};
  }, [dailyLogs]);

  const setMealCheck = useCallback((dateKey, mealId, checked) => {
    const current = dailyLogs[dateKey]?.meals || {};
    upsertDailyLog(dateKey, { meals: { ...current, [mealId]: checked } });
  }, [dailyLogs, upsertDailyLog]);

  // ── Supplements ──
  const getSuppChecks = useCallback((dateKey) => {
    return dailyLogs[dateKey]?.supplements || {};
  }, [dailyLogs]);

  const setSuppCheck = useCallback((dateKey, suppId, checked) => {
    const current = dailyLogs[dateKey]?.supplements || {};
    upsertDailyLog(dateKey, { supplements: { ...current, [suppId]: checked } });
  }, [dailyLogs, upsertDailyLog]);

  // ── Meal Overrides ──
  const getMealOverrides = useCallback((dateKey) => {
    return dailyLogs[dateKey]?.meal_overrides || {};
  }, [dailyLogs]);

  const setMealOverride = useCallback((dateKey, mealId, override) => {
    const current = dailyLogs[dateKey]?.meal_overrides || {};
    upsertDailyLog(dateKey, {
      meal_overrides: { ...current, [mealId]: { ...override, timestamp: new Date().toISOString() } },
    });
  }, [dailyLogs, upsertDailyLog]);

  const clearMealOverride = useCallback((dateKey, mealId) => {
    const current = { ...(dailyLogs[dateKey]?.meal_overrides || {}) };
    delete current[mealId];
    upsertDailyLog(dateKey, { meal_overrides: current });
  }, [dailyLogs, upsertDailyLog]);

  // ── Workouts ──
  const getWorkoutForDate = useCallback((dateKey) => {
    return dailyLogs[dateKey]?.workout || null;
  }, [dailyLogs]);

  const setWorkoutForDate = useCallback((dateKey, workout) => {
    upsertDailyLog(dateKey, { workout: workout || null });
  }, [upsertDailyLog]);

  // ── Barry's ──
  const getBarrysAttendance = useCallback(() => {
    const result = {};
    for (const [key, log] of Object.entries(dailyLogs)) {
      if (log.barrys) result[key] = true;
    }
    return result;
  }, [dailyLogs]);

  const setBarrysAttended = useCallback((dateKey) => {
    upsertDailyLog(dateKey, { barrys: true });
  }, [upsertDailyLog]);

  const getBarrysCount = useCallback(() => {
    return Object.values(dailyLogs).filter(l => l.barrys).length;
  }, [dailyLogs]);

  // ── Badges ──
  const getBadges = useCallback(() => userState.badges || {}, [userState]);

  const unlockBadge = useCallback((badgeId) => {
    const current = userState.badges || {};
    if (current[badgeId]) return false;
    updateUserState({ badges: { ...current, [badgeId]: { unlockedAt: new Date().toISOString() } } });
    return true;
  }, [userState, updateUserState]);

  // ── XP ──
  const getXP = useCallback(() => userState.xp || 0, [userState]);

  const addXP = useCallback((amount) => {
    const next = (userState.xp || 0) + amount;
    updateUserState({ xp: next });
    return next;
  }, [userState, updateUserState]);

  // ── Streaks ──
  const getStreaks = useCallback(() => {
    return userState.streaks || { logging: 0, meals: 0, supplements: 0, barrys: 0 };
  }, [userState]);

  const setStreaks = useCallback((streaks) => {
    updateUserState({ streaks });
  }, [updateUserState]);

  // ── Settings ──
  const isSoundEnabled = useCallback(() => userState.settings?.sound ?? true, [userState]);

  const setSoundEnabled = useCallback((enabled) => {
    updateUserState({ settings: { ...userState.settings, sound: enabled } });
  }, [userState, updateUserState]);

  const getPhaseOverride = useCallback(() => userState.settings?.phaseOverride ?? null, [userState]);

  const setPhaseOverride = useCallback((phase) => {
    updateUserState({ settings: { ...userState.settings, phaseOverride: phase } });
  }, [userState, updateUserState]);

  const getGoalWeight = useCallback(() => userState.settings?.goalWeight ?? 137.5, [userState]);

  const setGoalWeight = useCallback((weight) => {
    updateUserState({ settings: { ...userState.settings, goalWeight: weight } });
  }, [userState, updateUserState]);

  const getPhaseTransitionsShown = useCallback(() => userState.settings?.phaseTransitions ?? {}, [userState]);

  const markPhaseTransitionShown = useCallback((phase) => {
    const current = userState.settings?.phaseTransitions || {};
    updateUserState({ settings: { ...userState.settings, phaseTransitions: { ...current, [phase]: true } } });
  }, [userState, updateUserState]);

  // ── Export / Reset ──
  const exportWeightsCSV = useCallback(() => {
    const w = getWeights();
    const rows = ['Date,Weight (lbs)'];
    Object.entries(w)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, weight]) => rows.push(`${date},${weight}`));
    return rows.join('\n');
  }, [getWeights]);

  const resetAllData = useCallback(async () => {
    localStorage.removeItem('sb_daily_logs');
    localStorage.removeItem('sb_user_state');
    // Clear old localStorage keys too
    ['cut_weights', 'cut_meals', 'cut_supplements', 'cut_streaks', 'cut_badges',
     'cut_xp', 'soundEnabled', 'cut_phaseOverride', 'cut_goalWeight', 'cut_barrys',
     'cut_phaseTransitions', 'cut_workouts', 'cut_mealOverrides'].forEach(k => localStorage.removeItem(k));
    await supabase.from('daily_logs').delete().neq('date_key', '');
    await supabase.from('user_state').delete().eq('id', 'roy');
    window.location.reload();
  }, []);

  return {
    getWeights, getWeightForDate, logWeight,
    getMealChecks, setMealCheck,
    getSuppChecks, setSuppCheck,
    getMealOverrides, setMealOverride, clearMealOverride,
    getWorkoutForDate, setWorkoutForDate,
    getBarrysAttendance, setBarrysAttended, getBarrysCount,
    getBadges, unlockBadge,
    getXP, addXP,
    getStreaks, setStreaks,
    isSoundEnabled, setSoundEnabled,
    getPhaseOverride, setPhaseOverride,
    getGoalWeight, setGoalWeight,
    getPhaseTransitionsShown, markPhaseTransitionShown,
    exportWeightsCSV, resetAllData,
  };
}
