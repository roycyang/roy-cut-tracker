import { useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { usePlan } from '../context/UserPlanContext';
import { toDateKey, getCurrentPhase, getCurrentWeek } from '../utils/dateUtils';
import { useStorage } from '../hooks/useStorage';
import { computeStreaks, getStreakClass } from '../utils/streaks';
import { checkBadges } from '../utils/badges';
import SupplementRecommendations from '../components/SupplementRecommendations';

export default function SupplementsScreen() {
  const { showToast: onToast, handleBadgeUnlock: onBadgeUnlock } = useOutletContext();
  const storage = useStorage();
  const plan = usePlan();
  const today = new Date();
  const dateKey = toDateKey(today);
  const phase = getCurrentPhase(today, storage.getPhaseOverride(), plan);
  const week = getCurrentWeek(today, plan);
  const isBarrysDay = phase >= 2 && today.getDay() === 3;

  const barrysAttendance = storage.getBarrysAttendance();
  const barrysCount = storage.getBarrysCount();
  const barrysDoneToday = !!barrysAttendance[dateKey];
  const streaks = computeStreaks(storage);

  const handleBarrysCheck = useCallback(() => {
    storage.setBarrysAttended(dateKey);
    storage.addXP(plan.xp_values.barrysSession);
    onToast(`Barry's session completed! 🥊 +${plan.xp_values.barrysSession} XP`);
    const newBadges = checkBadges(storage);
    if (newBadges.length > 0) onBadgeUnlock(newBadges[0]);
  }, [dateKey, onToast, onBadgeUnlock, storage, plan.xp_values]);

  return (
    <div className="pb-4 animate-fade-in">
      <h2 className="text-lg font-bold mb-4">Supplements & Streaks</h2>

      {/* Daily stack info */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 mb-3">
        <h3 className="font-semibold text-sm mb-3">Daily Stack</h3>
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">7:30am</span>
            <span>Pre-Workout + Creatine (5g)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">9:00am</span>
            <span>Whey Isolate {phase >= 3 ? '(2 scoops)' : '(1 scoop)'} + Collagen Peptides</span>
          </div>
        </div>
        {phase >= 3 && (
          <div className="mt-3 pt-3 border-t border-[#2a2a2a] text-sm text-purple-400">
            ⬆️ Phase 3: 2 scoops Whey per shake
          </div>
        )}
      </div>

      {/* Streaks */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 mb-3">
        <h3 className="font-semibold text-sm mb-3">Streaks</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Logging', emoji: '🔥', count: streaks.logging },
            { label: 'Meals', emoji: '🍽️', count: streaks.meals },
            { label: 'Supps', emoji: '💊', count: streaks.supplements },
          ].map(s => (
            <div
              key={s.label}
              className={`bg-[#111] rounded-xl p-3 text-center ${getStreakClass(s.count)}`}
            >
              <div className="text-2xl font-bold">{s.count}</div>
              <div className="text-xs text-gray-400">{s.emoji} {s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Barry's section (Weeks 7-10) */}
      {week >= 7 && (
        <div className="bg-[#1a1a1a] rounded-xl p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">🥊 Barry's Streak</h3>
            <span className="text-2xl font-bold text-orange-400">{barrysCount}/4</span>
          </div>
          {isBarrysDay && !barrysDoneToday && (
            <button
              onClick={handleBarrysCheck}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 rounded-xl font-semibold text-white transition-colors"
            >
              Mark Barry's Complete 🔥
            </button>
          )}
          {barrysDoneToday && (
            <div className="text-center py-2 text-green-400 font-medium">
              ✓ Barry's completed today
            </div>
          )}
          {!isBarrysDay && (
            <div className="text-center py-2 text-gray-500 text-sm">
              {today.getDay() < 3 ? "Barry's is on Wednesday" : "See you next Wednesday"}
            </div>
          )}
        </div>
      )}

      {/* Supplement Recommendations with affiliate links */}
      <SupplementRecommendations />
    </div>
  );
}
