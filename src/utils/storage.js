const KEYS = {
  weights: 'cut_weights',
  meals: 'cut_meals',
  supplements: 'cut_supplements',
  streaks: 'cut_streaks',
  badges: 'cut_badges',
  xp: 'cut_xp',
  sound: 'soundEnabled',
  phaseOverride: 'cut_phaseOverride',
  goalWeight: 'cut_goalWeight',
  barrys: 'cut_barrys',
  phaseTransitions: 'cut_phaseTransitions',
};

function get(key, fallback = null) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function set(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Weight
export function getWeights() { return get(KEYS.weights, {}); }
export function logWeight(dateKey, weight) {
  const weights = getWeights();
  weights[dateKey] = weight;
  set(KEYS.weights, weights);
}
export function getWeightForDate(dateKey) {
  return getWeights()[dateKey] || null;
}

// Meals
export function getMealChecks(dateKey) { return get(KEYS.meals, {})[dateKey] || {}; }
export function setMealCheck(dateKey, mealId, checked) {
  const all = get(KEYS.meals, {});
  if (!all[dateKey]) all[dateKey] = {};
  all[dateKey][mealId] = checked;
  set(KEYS.meals, all);
}

// Supplements
export function getSuppChecks(dateKey) { return get(KEYS.supplements, {})[dateKey] || {}; }
export function setSuppCheck(dateKey, suppId, checked) {
  const all = get(KEYS.supplements, {});
  if (!all[dateKey]) all[dateKey] = {};
  all[dateKey][suppId] = checked;
  set(KEYS.supplements, all);
}

// Streaks
export function getStreaks() {
  return get(KEYS.streaks, { logging: 0, meals: 0, supplements: 0, barrys: 0 });
}
export function setStreaks(streaks) { set(KEYS.streaks, streaks); }

// Badges
export function getBadges() { return get(KEYS.badges, {}); }
export function unlockBadge(badgeId) {
  const badges = getBadges();
  if (!badges[badgeId]) {
    badges[badgeId] = { unlockedAt: new Date().toISOString() };
    set(KEYS.badges, badges);
    return true;
  }
  return false;
}

// XP
export function getXP() { return get(KEYS.xp, 0); }
export function addXP(amount) {
  const current = getXP();
  set(KEYS.xp, current + amount);
  return current + amount;
}

// Sound
export function isSoundEnabled() { return get(KEYS.sound, true); }
export function setSoundEnabled(enabled) { set(KEYS.sound, enabled); }

// Phase Override
export function getPhaseOverride() { return get(KEYS.phaseOverride, null); }
export function setPhaseOverride(phase) { set(KEYS.phaseOverride, phase); }

// Goal Weight
export function getGoalWeight() { return get(KEYS.goalWeight, 137.5); }
export function setGoalWeight(weight) { set(KEYS.goalWeight, weight); }

// Barry's attendance
export function getBarrysAttendance() { return get(KEYS.barrys, {}); }
export function setBarrysAttended(dateKey) {
  const all = getBarrysAttendance();
  all[dateKey] = true;
  set(KEYS.barrys, all);
}
export function getBarrysCount() { return Object.keys(getBarrysAttendance()).length; }

// Phase transitions shown
export function getPhaseTransitionsShown() { return get(KEYS.phaseTransitions, {}); }
export function markPhaseTransitionShown(phase) {
  const shown = getPhaseTransitionsShown();
  shown[phase] = true;
  set(KEYS.phaseTransitions, shown);
}

// Export CSV
export function exportWeightsCSV() {
  const weights = getWeights();
  const rows = ['Date,Weight (lbs)'];
  Object.entries(weights)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, weight]) => rows.push(`${date},${weight}`));
  return rows.join('\n');
}

// Reset all
export function resetAllData() {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}
