const KEY = 'cut_mealOverrides';

function getAll() {
  try {
    const val = localStorage.getItem(KEY);
    return val ? JSON.parse(val) : {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getMealOverride(dateKey, mealId) {
  const all = getAll();
  return all[dateKey]?.[mealId] || null;
}

export function getMealOverrides(dateKey) {
  return getAll()[dateKey] || {};
}

export function setMealOverride(dateKey, mealId, override) {
  const all = getAll();
  if (!all[dateKey]) all[dateKey] = {};
  all[dateKey][mealId] = {
    ...override,
    timestamp: new Date().toISOString(),
  };
  saveAll(all);
}

export function clearMealOverride(dateKey, mealId) {
  const all = getAll();
  if (all[dateKey]) {
    delete all[dateKey][mealId];
    if (Object.keys(all[dateKey]).length === 0) delete all[dateKey];
    saveAll(all);
  }
}
