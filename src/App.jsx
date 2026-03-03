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
import { isSoundEnabled, setSoundEnabled, getPhaseOverride, getPhaseTransitionsShown, markPhaseTransitionShown } from './utils/storage';
import { getCurrentPhase } from './utils/dateUtils';

export default function App() {
  const [screen, setScreen] = useState('today');
  const [toast, setToast] = useState(null);
  const [badgeUnlock, setBadgeUnlock] = useState(null);
  const [phaseTransition, setPhaseTransition] = useState(null);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  // Check phase transitions on mount
  useEffect(() => {
    const phase = getCurrentPhase(new Date(), getPhaseOverride());
    const shown = getPhaseTransitionsShown();
    if (phase >= 2 && !shown[2]) {
      setPhaseTransition(2);
      markPhaseTransitionShown(2);
    } else if (phase >= 3 && !shown[3]) {
      setPhaseTransition(3);
      markPhaseTransitionShown(3);
    }
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
  }, []);

  const handleBadgeUnlock = useCallback((badgeId) => {
    setBadgeUnlock(badgeId);
  }, []);

  const handleSoundToggle = useCallback(() => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  }, [soundOn]);

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
      {/* Sound toggle - top right */}
      <button
        onClick={handleSoundToggle}
        className="fixed top-3 right-3 z-50 text-lg w-9 h-9 flex items-center justify-center rounded-full bg-[#1a1a1a] border border-[#2a2a2a]"
        aria-label="Toggle sound"
      >
        {soundOn ? '🔊' : '🔇'}
      </button>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-20 max-w-lg mx-auto w-full">
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
