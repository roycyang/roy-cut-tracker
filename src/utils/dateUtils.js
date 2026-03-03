import { START_DATE, WEEKLY_TARGETS, TRAINING_WEEKS_1_6, TRAINING_WEEKS_7_10 } from '../data/config';

export function getToday() {
  return new Date();
}

export function toDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function daysBetween(a, b) {
  const msPerDay = 86400000;
  return Math.floor((new Date(b) - new Date(a)) / msPerDay);
}

export function getCurrentWeek(date = getToday()) {
  const days = daysBetween(START_DATE, date);
  if (days < 0) return 1;
  const week = Math.floor(days / 7) + 1;
  return Math.min(week, 10);
}

export function getCurrentPhase(date = getToday(), override = null) {
  if (override) return override;
  const week = getCurrentWeek(date);
  if (week <= 6) return 1;
  if (week === 7) return 2;
  return 3;
}

export function getWeekDateRange(weekNum) {
  const start = new Date(START_DATE);
  start.setDate(start.getDate() + (weekNum - 1) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

export function getTrainingForDay(date = getToday()) {
  const week = getCurrentWeek(date);
  const day = date.getDay();
  if (week <= 6) return TRAINING_WEEKS_1_6[day];
  return TRAINING_WEEKS_7_10[day];
}

export function getWeekTarget(weekNum) {
  return WEEKLY_TARGETS.find(w => w.week === weekNum);
}

export function isWaterCutPeriod(date = getToday()) {
  const waterCutStart = new Date(2026, 4, 4); // May 4
  const waterCutEnd = new Date(2026, 4, 10);   // May 10
  return date >= waterCutStart && date <= waterCutEnd;
}

export function isFinalWeek(date = getToday()) {
  const finalWeekStart = new Date(2026, 4, 4); // May 4
  return date >= finalWeekStart;
}

export function isTrainingDay(date = getToday()) {
  const training = getTrainingForDay(date);
  return training.type !== 'Rest';
}

export function formatDateShort(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateRange(start, end) {
  return `${formatDateShort(start)} – ${formatDateShort(end)}`;
}
