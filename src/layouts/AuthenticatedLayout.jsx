import { useState, useCallback, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Toast from '../components/Toast';
import PhaseTransition from '../components/PhaseTransition';
import BadgeUnlockModal from '../components/BadgeUnlockModal';
import { useData } from '../context/DataContext';
import { useStorage } from '../hooks/useStorage';
import { usePlan } from '../context/UserPlanContext';
import { getCurrentPhase } from '../utils/dateUtils';
import { setSoundCheck } from '../utils/sounds';
import SyncStatus from '../components/SyncStatus';

export default function AuthenticatedLayout() {
  const { refreshing, refreshData } = useData();
  const storage = useStorage();
  const plan = usePlan();

  const mainRef = useRef(null);
  const startY = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [toast, setToast] = useState(null);
  const [badgeUnlock, setBadgeUnlock] = useState(null);
  const [phaseTransition, setPhaseTransition] = useState(null);
  const [soundOn, setSoundOn] = useState(true);

  // Apply theme class to body
  useEffect(() => {
    const theme = storage.getTheme();
    document.body.classList.toggle('light', theme === 'light');
  }, [storage]);

  // Wire up sound check
  useEffect(() => {
    setSoundCheck(() => storage.isSoundEnabled());
  }, [storage]);

  // Initialize sound state
  useEffect(() => {
    setSoundOn(storage.isSoundEnabled());
  }, [storage]);

  // Check phase transitions on mount
  useEffect(() => {
    const phase = getCurrentPhase(new Date(), storage.getPhaseOverride(), plan);
    const shown = storage.getPhaseTransitionsShown();
    if (phase >= 2 && !shown[2]) {
      setPhaseTransition(2);
      storage.markPhaseTransitionShown(2);
    } else if (phase >= 3 && !shown[3]) {
      setPhaseTransition(3);
      storage.markPhaseTransitionShown(3);
    }
  }, [storage, plan]);

  const showToast = useCallback((msg) => {
    setToast(msg);
  }, []);

  const handleBadgeUnlock = useCallback((badgeId) => {
    setBadgeUnlock(badgeId);
  }, []);

  const handleSoundToggle = useCallback(() => {
    const next = !soundOn;
    setSoundOn(next);
    storage.setSoundEnabled(next);
  }, [soundOn, storage]);

  const handleThemeToggle = useCallback((theme) => {
    document.body.classList.toggle('light', theme === 'light');
  }, []);

  const onTouchStart = useCallback((e) => {
    if (mainRef.current && mainRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      setPullDistance(Math.min(dy * 0.5, 80));
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (pullDistance > 60 && !refreshing) {
      refreshData();
    }
    startY.current = null;
    setPullDistance(0);
  }, [pullDistance, refreshing, refreshData]);

  return (
    <>
      <SyncStatus />
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto px-4 pb-20 max-w-lg mx-auto w-full"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {(pullDistance > 0 || refreshing) && (
          <div
            className="flex justify-center overflow-hidden transition-all"
            style={{ height: refreshing ? 40 : pullDistance }}
          >
            <div
              className={`w-5 h-5 border-2 border-gray-600 border-t-white rounded-full ${
                refreshing || pullDistance > 60 ? 'animate-spin' : ''
              }`}
              style={!refreshing && pullDistance <= 60 ? { transform: `rotate(${pullDistance * 4}deg)` } : undefined}
            />
          </div>
        )}
        <Outlet context={{ showToast, handleBadgeUnlock, handleSoundToggle, handleThemeToggle }} />
      </main>

      <BottomNav />

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      {badgeUnlock && <BadgeUnlockModal badgeId={badgeUnlock} onDone={() => setBadgeUnlock(null)} />}
      {phaseTransition && (
        <PhaseTransition phase={phaseTransition} onDismiss={() => setPhaseTransition(null)} />
      )}
    </>
  );
}
