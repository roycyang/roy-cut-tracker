import { useState, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { PHASE_CONFIG, MOTIVATION, XP_VALUES, START_WEIGHT } from '../data/config';
import { getMealsForDay } from '../data/meals';
import {
  getCurrentWeek, getCurrentPhase, getTrainingForDay, toDateKey,
  isWaterCutPeriod, isFinalWeek, getWeekTarget, formatDateShort,
} from '../utils/dateUtils';
import {
  getWeightForDate, logWeight, getMealChecks, setMealCheck, addXP,
  getPhaseOverride, getWorkoutForDate, setWorkoutForDate,
} from '../utils/storage';
import { getMealOverrides, setMealOverride, clearMealOverride } from '../utils/mealOverrides';
import { recalculateStreaks, getStreakClass } from '../utils/streaks';
import { checkBadges } from '../utils/badges';
import { playMealCheck, playAllMealsDone, playWeeklyTargetHit } from '../utils/sounds';
import WeightModal from '../components/WeightModal';
import MealEditModal from '../components/MealEditModal';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const WORKOUT_OPTIONS = [
  { type: 'Lift', emoji: '💪' },
  { type: 'Core', emoji: '🧘' },
  { type: "Barry's", emoji: '🔥' },
  { type: 'Solidcore', emoji: '🔵' },
  { type: 'Active Recovery', emoji: '🚶' },
  { type: 'Rest', emoji: '😴' },
  { type: 'Other', emoji: '🏋️' },
];

function CheckBox({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        checked
          ? 'bg-green-600 border-green-600 text-white'
          : 'border-gray-600 text-transparent'
      }`}
    >
      ✓
    </button>
  );
}

function TimeLabel({ time }) {
  return <span className="text-[11px] text-gray-600 w-14 flex-shrink-0 text-right mr-3">{time}</span>;
}

export default function TodayScreen({ onToast, onBadgeUnlock }) {
  const [dateOffset, setDateOffset] = useState(0);

  const viewDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffset);
    return d;
  }, [dateOffset]);

  const isToday = dateOffset === 0;
  const dateKey = toDateKey(viewDate);
  const week = getCurrentWeek(viewDate);
  const phaseOverride = getPhaseOverride();
  const phase = getCurrentPhase(viewDate, phaseOverride);
  const training = getTrainingForDay(viewDate);
  const weekTarget = getWeekTarget(week);
  const phaseConfig = PHASE_CONFIG[phase];

  const [weightLogged, setWeightLogged] = useState(getWeightForDate(dateKey));
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);
  const [mealChecks, setMealChecksState] = useState(getMealChecks(dateKey));
  const [overrides, setOverrides] = useState(getMealOverrides(dateKey));
  const [editingMeal, setEditingMeal] = useState(null);
  const [, setForceUpdate] = useState(0);

  const workoutOverride = getWorkoutForDate(dateKey);
  const activeWorkout = workoutOverride || training;
  const isRestDay = activeWorkout.type === 'Rest' || activeWorkout.type === 'Active Recovery';

  const refreshForDate = useCallback((key) => {
    setWeightLogged(getWeightForDate(key));
    setMealChecksState(getMealChecks(key));
    setOverrides(getMealOverrides(key));
    setShowWorkoutPicker(false);
  }, []);

  const handleWorkoutSelect = (option) => {
    if (option.type === training.type) {
      setWorkoutForDate(dateKey, null);
    } else {
      setWorkoutForDate(dateKey, option);
    }
    setShowWorkoutPicker(false);
    setForceUpdate(n => n + 1);
  };

  const canGoPrev = dateOffset > 0;
  const canGoNext = dateOffset < 7;

  const goToPrev = () => {
    if (!canGoPrev) return;
    const newOffset = dateOffset - 1;
    setDateOffset(newOffset);
    const d = new Date();
    d.setDate(d.getDate() + newOffset);
    refreshForDate(toDateKey(d));
  };

  const goToNext = () => {
    if (!canGoNext) return;
    const newOffset = dateOffset + 1;
    setDateOffset(newOffset);
    const d = new Date();
    d.setDate(d.getDate() + newOffset);
    refreshForDate(toDateKey(d));
  };

  const goToToday = () => {
    setDateOffset(0);
    refreshForDate(toDateKey(new Date()));
  };

  const streaks = recalculateStreaks();
  const { meals, isBarrysDay, barrysNote } = getMealsForDay(viewDate, phase);

  const dayOfYear = Math.floor((viewDate - new Date(viewDate.getFullYear(), 0, 0)) / 86400000);
  const motivationList = isFinalWeek(viewDate) ? MOTIVATION.final : MOTIVATION[phase];
  const motivation = motivationList[dayOfYear % motivationList.length];

  const handleLogWeight = useCallback((weight) => {
    logWeight(dateKey, weight);
    if (isToday) addXP(XP_VALUES.logWeight);
    setWeightLogged(weight);
    setShowWeightModal(false);

    if (weekTarget && weight <= weekTarget.target) {
      const lostTotal = (START_WEIGHT - weight).toFixed(1);
      const toGo = (weight - 137.5).toFixed(1);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      playWeeklyTargetHit();
      if (isToday) addXP(XP_VALUES.weeklyTarget);
      onToast(`Week ${week} target crushed! 🎯 ${lostTotal} lbs down, ${toGo} to go`);
    }

    if (weight <= 137.5) {
      setTimeout(() => {
        const totalLost = (START_WEIGHT - weight).toFixed(1);
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
  }, [dateKey, week, weekTarget, onToast, onBadgeUnlock, isToday]);

  const handleCheck = useCallback((id, checked) => {
    setMealCheck(dateKey, id, checked);
    const updated = { ...mealChecks, [id]: checked };
    setMealChecksState(updated);

    if (checked) {
      addXP(XP_VALUES.checkMeal);
      const allMealsDone = updated.meal1 && updated.meal2 && updated.meal3;
      if (allMealsDone) {
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

  const handleMealOverrideSave = useCallback((mealId, overrideData) => {
    setMealOverride(dateKey, mealId, overrideData);
    setOverrides(getMealOverrides(dateKey));
    setEditingMeal(null);
  }, [dateKey]);

  const handleMealOverrideClear = useCallback((mealId) => {
    clearMealOverride(dateKey, mealId);
    setOverrides(getMealOverrides(dateKey));
  }, [dateKey]);

  // Resolve meals: use override macros when present
  const resolvedMeals = meals.map(m => overrides[m.id] ? { ...m, ...overrides[m.id] } : m);

  // Macro totals (only from the 3 meals, using overrides)
  const checkedMeals = resolvedMeals.filter(m => mealChecks[m.id]);
  const totalCal = checkedMeals.reduce((s, m) => s + m.cal, 0);
  const totalProtein = checkedMeals.reduce((s, m) => s + m.protein, 0);
  const allCal = resolvedMeals.reduce((s, m) => s + m.cal, 0);
  const allProtein = resolvedMeals.reduce((s, m) => s + m.protein, 0);

  const dateDisplay = isToday
    ? `Today — ${DAY_NAMES[viewDate.getDay()]}, ${formatDateShort(viewDate)}`
    : `${DAY_NAMES[viewDate.getDay()]}, ${formatDateShort(viewDate)}`;

  return (
    <div className="pb-4 animate-fade-in">
      {/* Date navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goToPrev}
          className={`w-9 h-9 flex items-center justify-center rounded-full bg-[#1a1a1a] active:bg-[#333] ${
            canGoPrev ? 'text-gray-400' : 'text-gray-700'
          }`}
          disabled={!canGoPrev}
        >
          ‹
        </button>
        <button onClick={goToToday} className="text-center">
          <div className="text-sm font-semibold text-white">{dateDisplay}</div>
          {!isToday && <div className="text-[10px] text-blue-400 mt-0.5">Tap to go to today</div>}
        </button>
        <button
          onClick={goToNext}
          className={`w-9 h-9 flex items-center justify-center rounded-full bg-[#1a1a1a] active:bg-[#333] ${
            canGoNext ? 'text-gray-400' : 'text-gray-700'
          }`}
          disabled={!canGoNext}
        >
          ›
        </button>
      </div>

      {/* Week + Phase header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg font-bold">Week {week}</span>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: phaseConfig.color + '33', color: phaseConfig.color }}
        >
          {phaseConfig.label}
        </span>
      </div>

      {/* Motivation */}
      <p className="text-gray-400 text-sm italic mb-4">"{motivation}"</p>

      {/* Banners */}
      {isWaterCutPeriod(viewDate) && (
        <div className="bg-purple-900/30 border border-purple-700/50 rounded-xl px-4 py-3 mb-3 text-sm">
          🧂 Water cut active — no added sodium, 1 gallon water/day
        </div>
      )}
      {isBarrysDay && (
        <div className="bg-orange-900/30 border border-orange-700/50 rounded-xl px-4 py-3 mb-3 text-sm">
          🔥 {barrysNote}
        </div>
      )}
      {phase >= 3 && (
        <div className="bg-purple-900/30 border border-purple-700/50 rounded-xl px-4 py-3 mb-3 text-sm">
          ⬆️ 2 scoops Whey today
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
            Log {isToday ? "Today's" : "This Day's"} Weight
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

      {/* ── Daily Timeline ── */}
      <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Daily Schedule</h3>
      <div className="space-y-2">

        {/* 7:30am — Pre-Workout + Creatine */}
        {!isRestDay && (
          <div
            className={`bg-[#1a1a1a] rounded-xl p-4 flex items-center gap-3 transition-all ${
              mealChecks.preworkout ? 'border border-green-800/40' : 'border border-transparent'
            }`}
          >
            <CheckBox checked={!!mealChecks.preworkout} onChange={() => handleCheck('preworkout', !mealChecks.preworkout)} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-gray-500">7:30am</span>
                <span className="font-semibold text-sm">Pre-Workout + Creatine</span>
              </div>
              <p className="text-xs text-gray-400">Pre-workout stack + 5g creatine</p>
            </div>
          </div>
        )}

        {/* 8:00am — Workout */}
        <div
          className={`bg-[#1a1a1a] rounded-xl p-4 transition-all ${
            mealChecks.workout ? 'border border-green-800/40' : 'border border-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <CheckBox checked={!!mealChecks.workout} onChange={() => handleCheck('workout', !mealChecks.workout)} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">8:00am</span>
                <span className="font-semibold text-sm">Workout</span>
              </div>
            </div>
            <button
              onClick={() => setShowWorkoutPicker(!showWorkoutPicker)}
              className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
                workoutOverride ? 'bg-[#333] border border-[#444]' : 'bg-[#252525]'
              }`}
            >
              {activeWorkout.emoji} {activeWorkout.type} ▾
            </button>
          </div>

          {/* Inline workout picker */}
          {showWorkoutPicker && (
            <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
              <div className="grid grid-cols-4 gap-1.5">
                {WORKOUT_OPTIONS.map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => handleWorkoutSelect(opt)}
                    className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs transition-all ${
                      activeWorkout.type === opt.type
                        ? 'bg-white/10 text-white font-semibold'
                        : 'text-gray-400 active:bg-white/5'
                    }`}
                  >
                    <span className="text-lg mb-0.5">{opt.emoji}</span>
                    <span className="truncate w-full text-center">{opt.type}</span>
                  </button>
                ))}
              </div>
              {workoutOverride && (
                <p className="text-[10px] text-gray-500 text-center mt-1.5">
                  Scheduled: {training.emoji} {training.type} · Tap to reset
                </p>
              )}
            </div>
          )}
        </div>

        {/* 9:00am — Meal 1 (Shake with Whey + Collagen) */}
        {meals.map(meal => {
          const override = overrides[meal.id];
          const display = override || meal;
          return (
            <div
              key={meal.id}
              className={`bg-[#1a1a1a] rounded-xl p-4 transition-all ${
                mealChecks[meal.id] ? 'border border-green-800/40' : 'border border-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                <CheckBox checked={!!mealChecks[meal.id]} onChange={() => handleCheck(meal.id, !mealChecks[meal.id])} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-gray-500">{meal.time}</span>
                    <span className="font-semibold text-sm">{display.name}</span>
                    <button
                      onClick={() => setEditingMeal(meal)}
                      className="ml-auto text-gray-600 active:text-blue-400 p-1 -m-1"
                      title="Edit meal"
                    >
                      ✏️
                    </button>
                  </div>
                  {display.ingredients && <p className="text-xs text-gray-400 mb-1">{display.ingredients}</p>}
                  {override && (
                    <div className="flex items-center gap-1 mb-1">
                      <p className="text-[10px] text-gray-600 line-through">{meal.name}</p>
                      <button
                        onClick={() => handleMealOverrideClear(meal.id)}
                        className="text-[10px] text-gray-600 underline ml-1"
                      >
                        reset
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-0.5 bg-orange-900/30 text-orange-400 rounded-full">{display.cal} cal</span>
                    <span className="text-xs px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded-full">{display.protein}g P</span>
                    <span className="text-xs px-2 py-0.5 bg-green-900/30 text-green-400 rounded-full">{display.carbs}g C</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Macro totals bar */}
      <div className="bg-[#111] rounded-xl p-3 mt-2 mb-4 flex items-center justify-between text-xs">
        <span className="text-gray-500">Meal Totals:</span>
        <div className="flex gap-3">
          <span className="text-orange-400 font-semibold">{totalCal}/{allCal} cal</span>
          <span className="text-blue-400 font-semibold">{totalProtein}/{allProtein}g P</span>
        </div>
      </div>

      {showWeightModal && (
        <WeightModal
          onSave={handleLogWeight}
          onClose={() => setShowWeightModal(false)}
          lastWeight={weightLogged}
        />
      )}

      {editingMeal && (
        <MealEditModal
          meal={editingMeal}
          onSave={(data) => handleMealOverrideSave(editingMeal.id, data)}
          onClose={() => setEditingMeal(null)}
        />
      )}
    </div>
  );
}
