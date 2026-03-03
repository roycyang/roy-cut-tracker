import { toDateKey } from './dateUtils';

export function recalculateStreaks({ getWeights, getMealChecks, getSuppChecks, getStreaks, setStreaks }) {
  const today = new Date();
  const weights = getWeights();
  let loggingStreak = 0;
  let mealStreak = 0;
  let suppStreak = 0;

  // Logging streak: count backward from today
  for (let i = 0; i < 100; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    if (weights[key]) {
      loggingStreak++;
    } else {
      break;
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
