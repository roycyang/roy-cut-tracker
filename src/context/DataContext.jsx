import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { queueWrite, replayPendingWrites } from '../utils/syncQueue';

const DataContext = createContext(null);

// Default state for new users (or when auth is not yet available)
function getDefaultUserState(userId) {
  return {
    user_id: userId || null,
    badges: {},
    xp: 0,
    streaks: { logging: 0, meals: 0, supplements: 0, barrys: 0 },
    settings: { sound: true, phaseOverride: null, goalWeight: 137.5, phaseTransitions: {} },
  };
}

export function DataProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyLogs, setDailyLogs] = useState({});
  const [userState, setUserState] = useState(getDefaultUserState());
  const [userId, setUserId] = useState(null);

  // Refs for latest state
  const dailyLogsRef = useRef(dailyLogs);
  const userStateRef = useRef(userState);
  dailyLogsRef.current = dailyLogs;
  userStateRef.current = userState;

  // Determine userId from auth or fallback to legacy mode
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        // Legacy mode: use 'roy' for backward compat during migration
        setUserId('__legacy__');
      }
    }
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId('__legacy__');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Replay pending writes when coming back online
  useEffect(() => {
    const handleOnline = () => {
      replayPendingWrites(supabase).then(({ synced }) => {
        if (synced > 0) console.log(`Synced ${synced} pending writes`);
      });
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        handleOnline();
      }
    });

    // Also replay on initial load if online
    if (navigator.onLine) handleOnline();

    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Load data when userId is resolved
  useEffect(() => {
    if (userId) loadInitialData(userId);
  }, [userId]);

  async function loadInitialData(uid) {
    setLoading(true);

    // Version-based hard refresh
    const storedBuild = localStorage.getItem('app_build_id');
    if (storedBuild && storedBuild !== __BUILD_ID__) {
      localStorage.setItem('app_build_id', __BUILD_ID__);
      window.location.reload();
      return;
    }
    localStorage.setItem('app_build_id', __BUILD_ID__);

    const cachePrefix = uid === '__legacy__' ? 'sb' : `sb_${uid}`;
    const isLegacy = uid === '__legacy__';

    try {
      let logsQuery = supabase.from('daily_logs').select('*');
      let stateQuery;

      if (isLegacy) {
        // Legacy mode: load all logs (single user), use old user_state table
        stateQuery = supabase.from('user_state').select('*').eq('id', 'roy').single();
      } else {
        logsQuery = logsQuery.eq('user_id', uid);
        stateQuery = supabase.from('user_state_v2').select('*').eq('user_id', uid).single();
      }

      const [logsRes, stateRes] = await Promise.all([logsQuery, stateQuery]);

      if (logsRes.error) throw logsRes.error;

      const logsMap = {};
      for (const row of logsRes.data) {
        logsMap[row.date_key] = row;
      }
      setDailyLogs(logsMap);

      if (stateRes.data) {
        setUserState(stateRes.data);
      } else if (isLegacy) {
        const defaultState = { id: 'roy', ...getDefaultUserState() };
        await supabase.from('user_state').upsert(defaultState);
        setUserState(defaultState);
      } else {
        setUserState(getDefaultUserState(uid));
      }

      // Cache to localStorage
      try {
        localStorage.setItem(`${cachePrefix}_daily_logs`, JSON.stringify(logsMap, (key, value) =>
          key === 'photo' ? undefined : value
        ));
      } catch { /* localStorage full */ }
      localStorage.setItem(`${cachePrefix}_user_state`, JSON.stringify(stateRes.data || getDefaultUserState(uid)));
    } catch (err) {
      console.warn('Supabase load failed, using localStorage fallback', err);
      try {
        const cachedLogs = localStorage.getItem(`${cachePrefix}_daily_logs`);
        const cachedState = localStorage.getItem(`${cachePrefix}_user_state`);
        if (cachedLogs) setDailyLogs(JSON.parse(cachedLogs));
        if (cachedState) setUserState(JSON.parse(cachedState));
      } catch {
        // Fresh start
      }
    }
    setLoading(false);
  }

  const upsertDailyLog = useCallback((dateKey, updates) => {
    setDailyLogs(prev => {
      const current = prev[dateKey] || { date_key: dateKey };
      const next = {
        ...current,
        ...updates,
        date_key: dateKey,
        updated_at: new Date().toISOString(),
      };

      // Add user_id for authenticated users
      if (userId && userId !== '__legacy__') {
        next.user_id = userId;
      }

      const newMap = { ...prev, [dateKey]: next };

      // Cache to localStorage
      const cachePrefix = userId === '__legacy__' ? 'sb' : `sb_${userId}`;
      try {
        localStorage.setItem(`${cachePrefix}_daily_logs`, JSON.stringify(newMap, (key, value) =>
          key === 'photo' ? undefined : value
        ));
      } catch { /* localStorage full */ }

      // Upsert to Supabase, queue for offline retry on failure
      supabase.from('daily_logs').upsert(next).then(({ error }) => {
        if (error) {
          console.warn('Supabase daily_logs upsert failed, queuing for sync:', error);
          queueWrite('daily_logs', 'upsert', next);
        }
      });

      return newMap;
    });
  }, [userId]);

  const refreshData = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    const isLegacy = userId === '__legacy__';
    const cachePrefix = isLegacy ? 'sb' : `sb_${userId}`;

    try {
      let logsQuery = supabase.from('daily_logs').select('*');
      let stateQuery;

      if (isLegacy) {
        stateQuery = supabase.from('user_state').select('*').eq('id', 'roy').single();
      } else {
        logsQuery = logsQuery.eq('user_id', userId);
        stateQuery = supabase.from('user_state_v2').select('*').eq('user_id', userId).single();
      }

      const [logsRes, stateRes] = await Promise.all([logsQuery, stateQuery]);
      if (logsRes.error) throw logsRes.error;

      const logsMap = {};
      for (const row of logsRes.data) {
        logsMap[row.date_key] = row;
      }
      setDailyLogs(logsMap);
      if (stateRes.data) setUserState(stateRes.data);

      try {
        localStorage.setItem(`${cachePrefix}_daily_logs`, JSON.stringify(logsMap, (key, value) =>
          key === 'photo' ? undefined : value
        ));
      } catch { /* localStorage full */ }
      localStorage.setItem(`${cachePrefix}_user_state`, JSON.stringify(stateRes.data || userStateRef.current));
    } catch (err) {
      console.warn('Refresh failed:', err);
    }
    setRefreshing(false);
  }, [userId]);

  const updateUserState = useCallback((updates) => {
    setUserState(prev => {
      const isLegacy = userId === '__legacy__';
      const next = { ...prev, ...updates, updated_at: new Date().toISOString() };

      if (isLegacy) {
        next.id = 'roy';
      } else {
        next.user_id = userId;
      }

      // Cache
      const cachePrefix = isLegacy ? 'sb' : `sb_${userId}`;
      localStorage.setItem(`${cachePrefix}_user_state`, JSON.stringify(next));

      // Upsert to Supabase, queue for offline retry on failure
      const table = isLegacy ? 'user_state' : 'user_state_v2';
      supabase.from(table).upsert(next).then(({ error }) => {
        if (error) {
          console.warn(`Supabase ${table} upsert failed, queuing for sync:`, error);
          queueWrite(table, 'upsert', next);
        }
      });

      return next;
    });
  }, [userId]);

  return (
    <DataContext.Provider value={{ loading, refreshing, refreshData, dailyLogs, userState, upsertDailyLog, updateUserState, userId }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
