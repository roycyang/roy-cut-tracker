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

export function getCurrentWeek(date = getToday(), plan = null) {
  const startDate = plan?.start_date ?? START_DATE;
  const totalWeeks = plan?.total_weeks ?? WEEKLY_TARGETS.length;
  const days = daysBetween(startDate, date);
  if (days < 0) return 1;
  const week = Math.floor(days / 7) + 1;
  return Math.min(week, totalWeeks);
}

export function getCurrentPhase(date = getToday(), override = null, plan = null) {
  if (override) return override;
  const week = getCurrentWeek(date, plan);
  const targets = plan?.weekly_targets ?? WEEKLY_TARGETS;
  const target = targets.find(t => t.week === week);
  if (target) return target.phase;
  // Fallback: derive from week position
  if (week <= 6) return 1;
  if (week === 7) return 2;
  return 3;
}

export function getWeekDateRange(weekNum, plan = null) {
  const startDate = plan?.start_date ?? START_DATE;
  const start = new Date(startDate);
  start.setDate(start.getDate() + (weekNum - 1) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

export function getTrainingForDay(date = getToday(), plan = null) {
  const week = getCurrentWeek(date, plan);
  const day = date.getDay();
  const early = plan?.training_weeks_1_6 ?? TRAINING_WEEKS_1_6;
  const late = plan?.training_weeks_7_10 ?? TRAINING_WEEKS_7_10;
  if (week <= 6) return early[day];
  return late[day];
}

export function getWeekTarget(weekNum, plan = null) {
  const targets = plan?.weekly_targets ?? WEEKLY_TARGETS;
  return targets.find(w => w.week === weekNum);
}

export function isWaterCutPeriod(date = getToday(), plan = null) {
  const endDate = plan?.end_date ?? new Date(2026, 4, 10);
  const waterCutStart = new Date(endDate);
  waterCutStart.setDate(waterCutStart.getDate() - 6);
  return date >= waterCutStart && date <= endDate;
}

export function isFinalWeek(date = getToday(), plan = null) {
  const endDate = plan?.end_date ?? new Date(2026, 4, 10);
  const finalWeekStart = new Date(endDate);
  finalWeekStart.setDate(finalWeekStart.getDate() - 6);
  return date >= finalWeekStart;
}

export function isTrainingDay(date = getToday(), plan = null) {
  const training = getTrainingForDay(date, plan);
  return training.type !== 'Rest';
}

export function formatDateShort(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateRange(start, end) {
  return `${formatDateShort(start)} – ${formatDateShort(end)}`;
}
