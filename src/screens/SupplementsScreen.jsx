import { useState, useCallback } from 'react';
import { SUPPLEMENTS, XP_VALUES } from '../data/config';
import { toDateKey, getCurrentPhase, getCurrentWeek } from '../utils/dateUtils';
import {
  getSuppChecks, setSuppCheck, addXP, getPhaseOverride,
  getBarrysCount, setBarrysAttended, getBarrysAttendance,
} from '../utils/storage';
import { recalculateStreaks } from '../utils/streaks';
import { checkBadges, checkFullSend } from '../utils/badges';
import { playSuppCheck, playAllSuppsDone } from '../utils/sounds';

export default function SupplementsScreen({ onToast, onBadgeUnlock }) {
  const today = new Date();
  const dateKey = toDateKey(today);
  const phase = getCurrentPhase(today, getPhaseOverride());
  const week = getCurrentWeek(today);
  const isBarrysDay = phase >= 2 && today.getDay() === 3;

  const [suppChecks, setSuppChecksState] = useState(getSuppChecks(dateKey));
  const [barrysAttendance] = useState(getBarrysAttendance());
  const barrysCount = getBarrysCount();
  const barrysDoneToday = !!barrysAttendance[dateKey];

  const handleSuppCheck = useCallback((suppId, checked) => {
    setSuppCheck(dateKey, suppId, checked);
    const updated = { ...suppChecks, [suppId]: checked };
    setSuppChecksState(updated);

    if (checked) {
      addXP(XP_VALUES.checkSupplement);
      const allDone = SUPPLEMENTS.every(s => updated[s.id]);
      if (allDone) {
        addXP(XP_VALUES.allSupplements);
        playAllSuppsDone();
        onToast('All supplements taken! 💊 +20 XP bonus');
        recalculateStreaks();

        // Check Full Send
        if (isBarrysDay && barrysDoneToday) {
          if (checkFullSend(dateKey)) {
            onBadgeUnlock('full_send');
          }
        }
      } else {
        playSuppCheck();
      }
    }

    const newBadges = checkBadges();
    if (newBadges.length > 0) onBadgeUnlock(newBadges[0]);
    recalculateStreaks();
  }, [dateKey, suppChecks, onToast, onBadgeUnlock, isBarrysDay, barrysDoneToday]);

  const handleBarrysCheck = useCallback(() => {
    setBarrysAttended(dateKey);
    addXP(XP_VALUES.barrysSession);
    onToast("Barry's session completed! 🥊 +50 XP");

    // Check Full Send
    const suppsAllDone = SUPPLEMENTS.every(s => suppChecks[s.id]);
    if (suppsAllDone) {
      if (checkFullSend(dateKey)) {
        onBadgeUnlock('full_send');
      }
    }

    const newBadges = checkBadges();
    if (newBadges.length > 0) onBadgeUnlock(newBadges[0]);
  }, [dateKey, suppChecks, onToast, onBadgeUnlock]);

  return (
    <div className="pb-4 animate-fade-in">
      <h2 className="text-lg font-bold mb-4">Supplements</h2>

      {/* Phase 3 banner */}
      {phase >= 3 && (
        <div className="bg-purple-900/30 border border-purple-700/50 rounded-xl px-4 py-3 mb-4 text-sm">
          ⬆️ 2 scoops Whey today
        </div>
      )}

      {/* Supplement checklist */}
      <div className="space-y-2 mb-6">
        {SUPPLEMENTS.map(supp => (
          <div
            key={supp.id}
            className={`bg-[#1a1a1a] rounded-xl p-4 flex items-center gap-3 transition-all ${
              suppChecks[supp.id] ? 'border border-green-800/40' : 'border border-transparent'
            }`}
          >
            <button
              onClick={() => handleSuppCheck(supp.id, !suppChecks[supp.id])}
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                suppChecks[supp.id]
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'border-gray-600 text-transparent'
              }`}
            >
              ✓
            </button>
            <div className="flex-1">
              <span className="font-medium text-sm">{supp.name}</span>
              {supp.time && <span className="text-xs text-gray-500 ml-2">({supp.time})</span>}
              {supp.id === 'whey' && phase >= 3 && (
                <span className="text-xs text-purple-400 ml-2">⬆️ 2 scoops</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Barry's section (Weeks 7-10) */}
      {week >= 7 && (
        <div className="bg-[#1a1a1a] rounded-xl p-4">
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
    </div>
  );
}
