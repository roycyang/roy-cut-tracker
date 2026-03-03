import { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { PHASE_CONFIG, MOTIVATION, XP_VALUES, WEEKLY_TARGETS } from '../data/config';
import { getMealsForDay } from '../data/meals';
import {
  getCurrentWeek, getCurrentPhase, getTrainingForDay, toDateKey,
  isWaterCutPeriod, isFinalWeek, isTrainingDay, getWeekTarget,
} from '../utils/dateUtils';
import {
  getWeightForDate, logWeight, getMealChecks, setMealCheck, addXP,
  getPhaseOverride,
} from '../utils/storage';
import { recalculateStreaks, getStreakClass } from '../utils/streaks';
import { checkBadges } from '../utils/badges';
import { playMealCheck, playAllMealsDone, playWeeklyTargetHit } from '../utils/sounds';
import WeightModal from '../components/WeightModal';

export default function TodayScreen({ onToast, onBadgeUnlock }) {
  const today = new Date();
  const dateKey = toDateKey(today);
  const week = getCurrentWeek(today);
  const phaseOverride = getPhaseOverride();
  const phase = getCurrentPhase(today, phaseOverride);
  const training = getTrainingForDay(today);
  const weekTarget = getWeekTarget(week);
  const phaseConfig = PHASE_CONFIG[phase];

  const [weightLogged, setWeightLogged] = useState(getWeightForDate(dateKey));
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [mealChecks, setMealChecksState] = useState(getMealChecks(dateKey));
  const [, setForceUpdate] = useState(0);

  const streaks = recalculateStreaks();
  const { meals, isBarrysDay, barrysNote } = getMealsForDay(today, phase);

  // Motivation line - pick by day
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const motivationList = isFinalWeek(today) ? MOTIVATION.final : MOTIVATION[phase];
  const motivation = motivationList[dayOfYear % motivationList.length];

  const handleLogWeight = useCallback((weight) => {
    logWeight(dateKey, weight);
    addXP(XP_VALUES.logWeight);
    setWeightLogged(weight);
    setShowWeightModal(false);

    // Check if hit weekly target
    if (weekTarget && weight <= weekTarget.target) {
      const lostTotal = (146 - weight).toFixed(1);
      const toGo = (weight - 137.5).toFixed(1);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      playWeeklyTargetHit();
      addXP(XP_VALUES.weeklyTarget);
      onToast(`Week ${week} target crushed! 🎯 ${lostTotal} lbs down, ${toGo} to go`);
    }

    // Check for final goal
    if (weight <= 137.5) {
      setTimeout(() => {
        const totalLost = (146 - weight).toFixed(1);
        for (let i = 0; i < 5; i++) {
          setTimeout(() => confetti({ particleCount: 100, spread: 120, origin: { y: 0.5 } }), i * 500);
        }
        onToast(`YOU DID IT. 🏆 ${totalLost} lbs lost!`);
      }, 1500);
    }

    const newBadges = checkBadges();
    if (newBadges.length > 0) onBadgeUnlock(newBadges[0]);
    recalculateStreaks();
    setForceUpdate(n => n + 1);
  }, [dateKey, week, weekTarget, onToast, onBadgeUnlock]);

  const handleMealCheck = useCallback((mealId, checked) => {
    setMealCheck(dateKey, mealId, checked);
    const updated = { ...mealChecks, [mealId]: checked };
    setMealChecksState(updated);

    if (checked) {
      addXP(XP_VALUES.checkMeal);
      const allDone = updated.meal1 && updated.meal2 && updated.meal3;
      if (allDone) {
        addXP(XP_VALUES.allMeals);
        playAllMealsDone();
        onToast('All meals logged! 🍽️ +25 XP bonus');
      } else {
        playMealCheck();
      }
    }

    const newBadges = checkBadges();
    if (newBadges.length > 0) onBadgeUnlock(newBadges[0]);
    recalculateStreaks();
  }, [dateKey, mealChecks, onToast, onBadgeUnlock]);

  // Macro totals
  const checkedMeals = meals.filter(m => mealChecks[m.id]);
  const totalCal = checkedMeals.reduce((s, m) => s + m.cal, 0);
  const totalProtein = checkedMeals.reduce((s, m) => s + m.protein, 0);
  const totalCarbs = checkedMeals.reduce((s, m) => s + m.carbs, 0);
  const allCal = meals.reduce((s, m) => s + m.cal, 0);
  const allProtein = meals.reduce((s, m) => s + m.protein, 0);

  const isRestDay = training.type === 'Rest' || training.type === 'Active Recovery';

  return (
    <div className="pb-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">Week {week}</span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: phaseConfig.color + '33', color: phaseConfig.color }}
          >
            {phaseConfig.label}
          </span>
        </div>
        <span className="text-sm font-medium px-3 py-1 bg-[#1a1a1a] rounded-full">
          {training.emoji} {training.type}
        </span>
      </div>

      {/* Motivation */}
      <p className="text-gray-400 text-sm italic mb-4">"{motivation}"</p>

      {/* Pre-workout note */}
      {!isRestDay && (
        <div className="bg-[#1a1a1a] rounded-xl px-4 py-3 mb-4 text-sm">
          <span className="text-gray-400">⏰ 7:30am — Take Pre-Workout</span>
        </div>
      )}

      {/* Banners */}
      {isWaterCutPeriod(today) && (
        <div className="bg-purple-900/30 border border-purple-700/50 rounded-xl px-4 py-3 mb-4 text-sm">
          🧂 Water cut active — no added sodium, 1 gallon water/day
        </div>
      )}
      {isBarrysDay && (
        <div className="bg-orange-900/30 border border-orange-700/50 rounded-xl px-4 py-3 mb-4 text-sm">
          🔥 {barrysNote}
        </div>
      )}

      {/* Streak row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Logging', emoji: '🔥', count: streaks.logging },
          { label: 'Meals', emoji: '🍽️', count: streaks.meals },
          { label: 'Supps', emoji: '💊', count: streaks.supplements },
        ].map(s => (
          <div
            key={s.label}
            className={`bg-[#1a1a1a] rounded-xl p-3 text-center ${getStreakClass(s.count)}`}
          >
            <div className="text-2xl font-bold">{s.count}</div>
            <div className="text-xs text-gray-400">{s.emoji} {s.label}</div>
          </div>
        ))}
      </div>

      {/* Weight section */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Target: {weekTarget?.target} lbs</span>
          {weightLogged && (
            <span className="text-green-400 text-sm">✓ {weightLogged} lbs</span>
          )}
        </div>
        {!weightLogged ? (
          <button
            onClick={() => setShowWeightModal(true)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-white transition-colors"
          >
            Log Today's Weight
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-green-900/20 border border-green-800/30 rounded-xl py-3 text-center">
              <span className="text-green-400 font-bold text-xl">{weightLogged} lbs</span>
            </div>
            <button
              onClick={() => setShowWeightModal(true)}
              className="px-4 py-3 bg-[#333] rounded-xl text-sm text-gray-300"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Meals */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">Meals</h3>
        <div className="space-y-2">
          {meals.map(meal => (
            <div
              key={meal.id}
              className={`bg-[#1a1a1a] rounded-xl p-4 transition-all ${
                mealChecks[meal.id] ? 'border border-green-800/40' : 'border border-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleMealCheck(meal.id, !mealChecks[meal.id])}
                  className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    mealChecks[meal.id]
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'border-gray-600 text-transparent'
                  }`}
                >
                  ✓
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-gray-500">{meal.time}</span>
                    <span className="font-semibold text-sm">{meal.name}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{meal.ingredients}</p>
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-0.5 bg-orange-900/30 text-orange-400 rounded-full">{meal.cal} cal</span>
                    <span className="text-xs px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded-full">{meal.protein}g P</span>
                    <span className="text-xs px-2 py-0.5 bg-green-900/30 text-green-400 rounded-full">{meal.carbs}g C</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Macro totals bar */}
        <div className="bg-[#111] rounded-xl p-3 mt-2 flex items-center justify-between text-xs">
          <span className="text-gray-500">Running Total:</span>
          <div className="flex gap-3">
            <span className="text-orange-400 font-semibold">{totalCal}/{allCal} cal</span>
            <span className="text-blue-400 font-semibold">{totalProtein}/{allProtein}g P</span>
          </div>
        </div>
      </div>

      {showWeightModal && (
        <WeightModal
          onSave={handleLogWeight}
          onClose={() => setShowWeightModal(false)}
          lastWeight={weightLogged}
        />
      )}
    </div>
  );
}
