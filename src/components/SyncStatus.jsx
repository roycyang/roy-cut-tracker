import { useState, useEffect, useCallback } from 'react';
import { getPendingCount, replayPendingWrites } from '../utils/syncQueue';
import { supabase } from '../utils/supabase';

export default function SyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  const checkPending = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  const syncNow = useCallback(async () => {
    if (syncing || !online) return;
    setSyncing(true);
    try {
      await replayPendingWrites(supabase);
      await checkPending();
    } finally {
      setSyncing(false);
    }
  }, [syncing, online, checkPending]);

  useEffect(() => {
    checkPending();
    const interval = setInterval(checkPending, 10000); // check every 10s

    const handleOnline = () => {
      setOnline(true);
      syncNow(); // auto-sync when coming back online
    };
    const handleOffline = () => setOnline(false);
    const handleFocus = () => {
      checkPending();
      if (navigator.onLine) syncNow();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleFocus();
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkPending, syncNow]);

  // Don't show anything if all is synced and online
  if (online && pendingCount === 0) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[60] text-center py-1 text-xs font-medium transition-colors ${
      !online
        ? 'bg-yellow-600 text-yellow-100'
        : syncing
          ? 'bg-blue-600 text-blue-100'
          : 'bg-orange-600 text-orange-100'
    }`}
    style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {!online ? (
        'Offline — changes saved locally'
      ) : syncing ? (
        'Syncing...'
      ) : (
        <button onClick={syncNow}>
          {pendingCount} pending {pendingCount === 1 ? 'change' : 'changes'} — tap to sync
        </button>
      )}
    </div>
  );
}
