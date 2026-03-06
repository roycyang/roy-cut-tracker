import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabase';

const DataContext = createContext(null);

const DEFAULT_USER_STATE = {
  id: 'roy',
  badges: {},
  xp: 0,
  streaks: { logging: 0, meals: 0, supplements: 0, barrys: 0 },
  settings: { sound: true, phaseOverride: null, goalWeight: 137.5, phaseTransitions: {} },
};

export function DataProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyLogs, setDailyLogs] = useState({});
  const [userState, setUserState] = useState(DEFAULT_USER_STATE);

  // Refs for latest state (avoids stale closures in fire-and-forget writes)
  const dailyLogsRef = useRef(dailyLogs);
  const userStateRef = useRef(userState);
  dailyLogsRef.current = dailyLogs;
  userStateRef.current = userState;

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    // Version-based hard refresh: detect new deploys
    const storedBuild = localStorage.getItem('app_build_id');
    if (storedBuild && storedBuild !== __BUILD_ID__) {
      localStorage.setItem('app_build_id', __BUILD_ID__);
      window.location.reload();
      return;
    }
    localStorage.setItem('app_build_id', __BUILD_ID__);

    try {
      const [logsRes, stateRes] = await Promise.all([
        supabase.from('daily_logs').select('*'),
        supabase.from('user_state').select('*').eq('id', 'roy').single(),
      ]);

      if (logsRes.error) throw logsRes.error;

      const logsMap = {};
      for (const row of logsRes.data) {
        logsMap[row.date_key] = row;
      }
      setDailyLogs(logsMap);

      if (stateRes.data) {
        setUserState(stateRes.data);
      } else {
        // Initialize user_state row if it doesn't exist
        await supabase.from('user_state').upsert(DEFAULT_USER_STATE);
      }

      // Cache to localStorage as offline fallback (strip photos to save space)
      try {
        localStorage.setItem('sb_daily_logs', JSON.stringify(logsMap, (key, value) =>
          key === 'photo' ? undefined : value
        ));
      } catch { /* localStorage full */ }
      localStorage.setItem('sb_user_state', JSON.stringify(stateRes.data || DEFAULT_USER_STATE));
    } catch (err) {
      console.warn('Supabase load failed, using localStorage fallback', err);
      try {
        const cachedLogs = localStorage.getItem('sb_daily_logs');
        const cachedState = localStorage.getItem('sb_user_state');
        if (cachedLogs) setDailyLogs(JSON.parse(cachedLogs));
        if (cachedState) setUserState(JSON.parse(cachedState));
      } catch {
        // Fresh start if localStorage is also empty
      }
    }
    setLoading(false);
  }

  const upsertDailyLog = useCallback((dateKey, updates) => {
    setDailyLogs(prev => {
      const current = prev[dateKey] || { date_key: dateKey };
      const next = { ...current, ...updates, date_key: dateKey, updated_at: new Date().toISOString() };
      const newMap = { ...prev, [dateKey]: next };

      // Cache to localStorage (strip photos to avoid QuotaExceededError)
      try {
        localStorage.setItem('sb_daily_logs', JSON.stringify(newMap, (key, value) =>
          key === 'photo' ? undefined : value
        ));
      } catch {
        // localStorage full — Supabase is the source of truth anyway
      }

      // Fire and forget Supabase upsert
      supabase.from('daily_logs').upsert(next).then(({ error }) => {
        if (error) console.warn('Supabase daily_logs upsert failed:', error);
      });

      return newMap;
    });
  }, []);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [logsRes, stateRes] = await Promise.all([
        supabase.from('daily_logs').select('*'),
        supabase.from('user_state').select('*').eq('id', 'roy').single(),
      ]);
      if (logsRes.error) throw logsRes.error;

      const logsMap = {};
      for (const row of logsRes.data) {
        logsMap[row.date_key] = row;
      }
      setDailyLogs(logsMap);
      if (stateRes.data) setUserState(stateRes.data);

      try {
        localStorage.setItem('sb_daily_logs', JSON.stringify(logsMap, (key, value) =>
          key === 'photo' ? undefined : value
        ));
      } catch { /* localStorage full */ }
      localStorage.setItem('sb_user_state', JSON.stringify(stateRes.data || userStateRef.current));
    } catch (err) {
      console.warn('Refresh failed:', err);
    }
    setRefreshing(false);
  }, []);

  const updateUserState = useCallback((updates) => {
    setUserState(prev => {
      const next = { ...prev, ...updates, id: 'roy', updated_at: new Date().toISOString() };

      // Cache to localStorage
      localStorage.setItem('sb_user_state', JSON.stringify(next));

      // Fire and forget Supabase upsert
      supabase.from('user_state').upsert(next).then(({ error }) => {
        if (error) console.warn('Supabase user_state upsert failed:', error);
      });

      return next;
    });
  }, []);

  return (
    <DataContext.Provider value={{ loading, refreshing, refreshData, dailyLogs, userState, upsertDailyLog, updateUserState }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
