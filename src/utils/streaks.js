import { toDateKey } from './dateUtils';
import { getWeights, getMealChecks, getSuppChecks, getStreaks, setStreaks } from './storage';

export function recalculateStreaks() {
  const today = new Date();
  let loggingStreak = 0;
  let mealStreak = 0;
  let suppStreak = 0;

  // Count backward from today
  for (let i = 0; i < 100; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);

    // Don't count future days or if we haven't reached today yet
    if (i === 0) {
      // Today: check if logged
      const weights = getWeights();
      if (weights[key]) loggingStreak++;
      else break;
    } else {
      const weights = getWeights();
      if (weights[key]) loggingStreak++;
      else break;
    }
  }

  // Meal streak
  for (let i = 0; i < 100; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    const checks = getMealChecks(key);
    if (checks.meal1 && checks.meal2 && checks.meal3) {
      mealStreak++;
    } else if (i === 0) {
      // Today can be incomplete, don't break but don't count
      // Only count if all checked
      break;
    } else {
      break;
    }
  }

  // Supplement streak
  for (let i = 0; i < 100; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    const checks = getSuppChecks(key);
    if (checks.preworkout && checks.creatine && checks.whey && checks.collagen) {
      suppStreak++;
    } else if (i === 0) {
      break;
    } else {
      break;
    }
  }

  const current = getStreaks();
  const updated = {
    logging: loggingStreak,
    meals: mealStreak,
    supplements: suppStreak,
    barrys: current.barrys || 0,
  };
  setStreaks(updated);
  return updated;
}

export function getStreakClass(count) {
  if (count >= 7) return 'animate-pulse-gold';
  if (count >= 3) return 'animate-glow-orange';
  return '';
}
