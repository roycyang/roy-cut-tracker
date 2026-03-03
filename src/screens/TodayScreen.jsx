import { useState, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { PHASE_CONFIG, MOTIVATION, XP_VALUES, START_WEIGHT, START_DATE } from '../data/config';
import { getMealsForDay } from '../data/meals';
import {
  getCurrentWeek, getCurrentPhase, getTrainingForDay, toDateKey,
  isWaterCutPeriod, isFinalWeek, getWeekTarget, formatDateShort,
} from '../utils/dateUtils';
import { useStorage } from '../hooks/useStorage';
import { computeStreaks, getStreakClass } from '../utils/streaks';
import { checkBadges } from '../utils/badges';
import { playMealCheck, playAllMealsDone, playWeeklyTargetHit } from '../utils/sounds';
import WeightModal from '../components/WeightModal';
import MealEditModal from '../components/MealEditModal';
import AddSnackModal from '../components/AddSnackModal';

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

export default function TodayScreen({ onToast, onBadgeUnlock }) {
  const storage = useStorage();
  const [dateOffset, setDateOffset] = useState(0);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [showAddSnack, setShowAddSnack] = useState(false);

  const viewDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffset);
    return d;
  }, [dateOffset]);

  const isToday = dateOffset === 0;
  const dateKey = toDateKey(viewDate);
  const week = getCurrentWeek(viewDate);
  const phaseOverride = storage.getPhaseOverride();
  const phase = getCurrentPhase(viewDate, phaseOverride);
  const training = getTrainingForDay(viewDate);
  const weekTarget = getWeekTarget(week);
  const phaseConfig = PHASE_CONFIG[phase];

  // Read directly from context — no local state mirroring needed
  const weightLogged = storage.getWeightForDate(dateKey);
  const mealChecks = storage.getMealChecks(dateKey);
  const overrides = storage.getMealOverrides(dateKey);
  const workoutOverride = storage.getWorkoutForDate(dateKey);

  const activeWorkout = workoutOverride || training;
  const isRestDay = activeWorkout.type === 'Rest' || activeWorkout.type === 'Active Recovery';

  const handleWorkoutSelect = (option) => {
    if (option.type === training.type) {
      storage.setWorkoutForDate(dateKey, null);
    } else {
      storage.setWorkoutForDate(dateKey, option);
    }
    setShowWorkoutPicker(false);
  };

  const minOffset = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(START_DATE);
    start.setHours(0, 0, 0, 0);
    return Math.floor((start - today) / (1000 * 60 * 60 * 24));
  }, []);
  const canGoPrev = dateOffset > minOffset;
  const canGoNext = dateOffset < 7;

  const goToPrev = () => {
    if (!canGoPrev) return;
    setDateOffset(dateOffset - 1);
    setShowWorkoutPicker(false);
  };

  const goToNext = () => {
    if (!canGoNext) return;
    setDateOffset(dateOffset + 1);
    setShowWorkoutPicker(false);
  };

  const goToToday = () => {
    setDateOffset(0);
    setShowWorkoutPicker(false);
  };

  const streaks = computeStreaks(storage);
  const { meals, isBarrysDay, barrysNote } = getMealsForDay(viewDate, phase);

  const dayOfYear = Math.floor((viewDate - new Date(viewDate.getFullYear(), 0, 0)) / 86400000);
  const motivationList = isFinalWeek(viewDate) ? MOTIVATION.final : MOTIVATION[phase];
  const motivation = motivationList[dayOfYear % motivationList.length];

  const handleLogWeight = useCallback((weight) => {
    storage.logWeight(dateKey, weight);
    if (isToday) storage.addXP(XP_VALUES.logWeight);
    setShowWeightModal(false);

    if (weekTarget && weight <= weekTarget.target) {
      const lostTotal = (START_WEIGHT - weight).toFixed(1);
      const toGo = (weight - 137.5).toFixed(1);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      playWeeklyTargetHit();
      if (isToday) storage.addXP(XP_VALUES.weeklyTarget);
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

    const newBadges = checkBadges(storage);
    if (newBadges.length > 0) onBadgeUnlock(newBadges[0]);
    computeStreaks(storage);
  }, [dateKey, week, weekTarget, onToast, onBadgeUnlock, isToday, storage]);

  const handleCheck = useCallback((id, checked) => {
    storage.setMealCheck(dateKey, id, checked);

    if (checked) {
      storage.addXP(XP_VALUES.checkMeal);
      const updated = { ...mealChecks, [id]: checked };
      const allMealsDone = updated.meal1 && updated.meal2 && updated.meal3;
      if (allMealsDone) {
        storage.addXP(XP_VALUES.allMeals);
        playAllMealsDone();
        onToast('All meals logged! 🍽️ +25 XP bonus');
      } else {
        playMealCheck();
      }
    }

    const newBadges = checkBadges(storage);
    if (newBadges.length > 0) onBadgeUnlock(newBadges[0]);
    computeStreaks(storage);
  }, [dateKey, mealChecks, onToast, onBadgeUnlock, storage]);

  const handleMealOverrideSave = useCallback((mealId, overrideData) => {
    storage.setMealOverride(dateKey, mealId, overrideData);
    setEditingMeal(null);
  }, [dateKey, storage]);

  const handleMealOverrideClear = useCallback((mealId) => {
    storage.clearMealOverride(dateKey, mealId);
  }, [dateKey, storage]);

  // Resolve meals: use override macros when present
  const resolvedMeals = meals.map(m => overrides[m.id] ? { ...m, ...overrides[m.id] } : m);
  const extraMeals = storage.getExtraMeals(dateKey);

  // Macro totals (planned meals + extra meals)
  const checkedMeals = resolvedMeals.filter(m => mealChecks[m.id]);
  const extraCal = extraMeals.reduce((s, m) => s + m.cal, 0);
  const extraProtein = extraMeals.reduce((s, m) => s + m.protein, 0);
  const totalCal = checkedMeals.reduce((s, m) => s + m.cal, 0) + extraCal;
  const totalProtein = checkedMeals.reduce((s, m) => s + m.protein, 0) + extraProtein;
  const allCal = resolvedMeals.reduce((s, m) => s + m.cal, 0) + extraCal;
  const allProtein = resolvedMeals.reduce((s, m) => s + m.protein, 0) + extraProtein;

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

        {/* Meals */}
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
                      className="ml-auto text-gray-600 active:text-blue-400 p-2 -m-2"
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
                  {display.photo && (
                    <img src={display.photo} alt="" className="w-full h-24 object-cover rounded-lg mb-1.5" />
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

        {/* Extra Meals / Snacks */}
        {extraMeals.map(extra => (
          <div key={extra.id} className="bg-[#1a1a1a] rounded-xl p-4 border border-green-800/40 transition-all">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0 text-white text-xs">✓</span>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm">{extra.name}</span>
                {extra.photo && (
                  <img src={extra.photo} alt="" className="w-full h-24 object-cover rounded-lg mt-1.5" />
                )}
                <div className="flex gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 bg-orange-900/30 text-orange-400 rounded-full">{extra.cal} cal</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded-full">{extra.protein}g P</span>
                  <span className="text-xs px-2 py-0.5 bg-green-900/30 text-green-400 rounded-full">{extra.carbs}g C</span>
                </div>
              </div>
              <button
                onClick={() => storage.removeExtraMeal(dateKey, extra.id)}
                className="text-gray-600 active:text-red-400 p-1 -m-1 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        {/* Add Snack button */}
        <button
          onClick={() => setShowAddSnack(true)}
          className="w-full py-3 border-2 border-dashed border-[#333] rounded-xl text-gray-500 text-sm font-medium active:border-gray-400 active:text-gray-300 transition-colors"
        >
          + Add Snack
        </button>
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

      {showAddSnack && (
        <AddSnackModal
          onSave={(meal) => {
            storage.addExtraMeal(dateKey, meal);
            setShowAddSnack(false);
          }}
          onClose={() => setShowAddSnack(false)}
        />
      )}
    </div>
  );
}
