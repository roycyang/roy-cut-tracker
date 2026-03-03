import { useState, useCallback, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';
import PhaseTransition from './components/PhaseTransition';
import BadgeUnlockModal from './components/BadgeUnlockModal';
import TodayScreen from './screens/TodayScreen';
import ProgressScreen from './screens/ProgressScreen';
import BadgesScreen from './screens/BadgesScreen';
import SupplementsScreen from './screens/SupplementsScreen';
import SettingsScreen from './screens/SettingsScreen';
import { useData } from './context/DataContext';
import { useStorage } from './hooks/useStorage';
import { getCurrentPhase } from './utils/dateUtils';
import { setSoundCheck } from './utils/sounds';

export default function App() {
  const { loading } = useData();
  const storage = useStorage();

  const [screen, setScreen] = useState('today');
  const [toast, setToast] = useState(null);
  const [badgeUnlock, setBadgeUnlock] = useState(null);
  const [phaseTransition, setPhaseTransition] = useState(null);
  const [soundOn, setSoundOn] = useState(true);

  // Wire up sound check to use context-backed setting
  useEffect(() => {
    setSoundCheck(() => storage.isSoundEnabled());
  }, [storage]);

  // Initialize sound state once loading is done
  useEffect(() => {
    if (!loading) {
      setSoundOn(storage.isSoundEnabled());
    }
  }, [loading, storage]);

  // Check phase transitions on mount (after data loads)
  useEffect(() => {
    if (loading) return;
    const phase = getCurrentPhase(new Date(), storage.getPhaseOverride());
    const shown = storage.getPhaseTransitionsShown();
    if (phase >= 2 && !shown[2]) {
      setPhaseTransition(2);
      storage.markPhaseTransitionShown(2);
    } else if (phase >= 3 && !shown[3]) {
      setPhaseTransition(3);
      storage.markPhaseTransitionShown(3);
    }
  }, [loading, storage]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (screen) {
      case 'today':
        return <TodayScreen onToast={showToast} onBadgeUnlock={handleBadgeUnlock} />;
      case 'progress':
        return <ProgressScreen />;
      case 'badges':
        return <BadgesScreen />;
      case 'supplements':
        return <SupplementsScreen onToast={showToast} onBadgeUnlock={handleBadgeUnlock} />;
      case 'settings':
        return <SettingsScreen onSoundToggle={handleSoundToggle} />;
      default:
        return <TodayScreen onToast={showToast} onBadgeUnlock={handleBadgeUnlock} />;
    }
  };

  return (
    <>
      {/* Main content, top padding respects Dynamic Island safe area */}
      <main
        className="flex-1 overflow-y-auto px-4 pb-20 max-w-lg mx-auto w-full"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        {renderScreen()}
      </main>

      <BottomNav active={screen} onNavigate={setScreen} />

      {/* Overlays */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      {badgeUnlock && <BadgeUnlockModal badgeId={badgeUnlock} onDone={() => setBadgeUnlock(null)} />}
      {phaseTransition && (
        <PhaseTransition phase={phaseTransition} onDismiss={() => setPhaseTransition(null)} />
      )}
    </>
  );
}
