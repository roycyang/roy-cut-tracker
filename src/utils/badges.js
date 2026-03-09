import { BADGES, XP_VALUES, WEEKLY_TARGETS } from '../data/config';
import { getCurrentWeek, toDateKey } from './dateUtils';
import { computeStreaks } from './streaks';

/**
 * Dynamic badge evaluation engine.
 * When a plan is provided, uses plan-defined badges and targets.
 * Falls back to hardcoded config for legacy mode.
 */
export function checkBadges(storage, plan = null) {
  const { getWeights, getBadges, unlockBadge, addXP, getBarrysCount, getSolidcoreCount } = storage;
  const newlyUnlocked = [];
  const today = new Date();
  const week = getCurrentWeek(today, plan);
  const weights = getWeights();
  const streaks = computeStreaks(storage);
  const badges = getBadges();
  const xpValues = plan?.xp_values ?? XP_VALUES;
  const weeklyTargets = plan?.weekly_targets ?? WEEKLY_TARGETS;
  const totalWeeks = plan?.total_weeks ?? weeklyTargets.length;
  const goalWeight = plan
    ? (plan.goal_weight_min + plan.goal_weight_max) / 2
    : 137.5;

  function tryUnlock(badgeId) {
    if (badges[badgeId]) return false;
    if (unlockBadge(badgeId)) {
      addXP(xpValues.badgeUnlocked);
      newlyUnlocked.push(badgeId);
      return true;
    }
    return false;
  }

  // First Blood: any weight logged in week 1
  if (!badges.first_blood) {
    const week1Target = weeklyTargets.find(w => w.week === 1);
    if (week1Target) {
      // Check if any weight exists during week 1
      const startDate = new Date(week1Target.startDate);
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const key = toDateKey(d);
        if (weights[key] != null) {
          tryUnlock('first_blood');
          break;
        }
      }
    }
  }

  // Week 1 Warrior: complete week 1
  if (week >= 2) tryUnlock('week1_warrior');

  // Halfway: complete the midpoint week
  const midpoint = Math.ceil(totalWeeks / 2);
  if (week >= midpoint + 1) tryUnlock('halfway');

  // Phase Shifter: enter phase 2
  if (!badges.phase_shifter) {
    const phase2Week = weeklyTargets.find(w => w.phase === 2);
    if (phase2Week && week >= phase2Week.week) {
      tryUnlock('phase_shifter');
    }
  }

  // Red Zone: enter phase 3
  if (!badges.red_zone) {
    const phase3Week = weeklyTargets.find(w => w.phase === 3);
    if (phase3Week && week >= phase3Week.week) {
      tryUnlock('red_zone');
    }
  }

  // Iron Will: 7-day meal streak
  if (streaks.meals >= 7) tryUnlock('iron_will');

  // Supplement King: 14-day supplement streak
  if (streaks.supplements >= 14) tryUnlock('supplement_king');

  // On Target: hit any weekly weight target
  if (!badges.on_target) {
    for (const wt of weeklyTargets) {
      if (wt.week > week) break;
      const weekWeights = getWeightsForWeek(wt.week, weights, weeklyTargets);
      if (weekWeights.length > 0 && Math.min(...weekWeights) <= wt.target) {
        tryUnlock('on_target');
        break;
      }
    }
  }

  // 5 for 5: hit 5 consecutive weekly targets
  if (!badges.five_for_five) {
    let consecutive = 0;
    for (const wt of weeklyTargets) {
      if (wt.week > week) break;
      const weekWeights = getWeightsForWeek(wt.week, weights, weeklyTargets);
      if (weekWeights.length > 0) {
        consecutive = Math.min(...weekWeights) <= wt.target ? consecutive + 1 : 0;
        if (consecutive >= 5) {
          tryUnlock('five_for_five');
          break;
        }
      } else {
        consecutive = 0;
      }
    }
  }

  // Barry's Beast
  if (getBarrysCount() >= 4) tryUnlock('barrys_beast');

  // Solidcore 10 & 20
  const solidcore = getSolidcoreCount();
  if (solidcore >= 10) tryUnlock('solidcore_10');
  if (solidcore >= 20) tryUnlock('solidcore_20');

  // Shredded: hit goal weight
  if (!badges.shredded) {
    if (Object.values(weights).some(w => w <= goalWeight)) {
      if (!badges.shredded && unlockBadge('shredded')) {
        addXP(xpValues.badgeUnlocked + xpValues.finalGoal);
        newlyUnlocked.push('shredded');
      }
    }
  }

  // The Full Cut: complete all weeks
  if (!badges.the_full_cut) {
    const lastWeek = weeklyTargets[weeklyTargets.length - 1];
    if (lastWeek) {
      const endDate = new Date(lastWeek.startDate);
      endDate.setDate(endDate.getDate() + 6);
      if (today >= endDate) {
        tryUnlock('the_full_cut');
      }
    }
  }

  return newlyUnlocked;
}

export function checkFullSend(dateKey, storage) {
  const { getBadges, getBarrysAttendance, getMealChecks, getSuppChecks, unlockBadge, addXP } = storage;
  const badges = getBadges();
  if (badges.full_send) return false;

  const barrys = getBarrysAttendance();
  const meals = getMealChecks(dateKey);
  const supps = getSuppChecks(dateKey);

  if (
    barrys[dateKey] &&
    meals.meal1 && meals.meal2 && meals.meal3 &&
    supps.preworkout && supps.creatine && supps.whey && supps.collagen
  ) {
    if (unlockBadge('full_send')) {
      addXP(XP_VALUES.badgeUnlocked);
      return true;
    }
  }
  return false;
}

export function getWeightsForWeek(weekNum, weights, weeklyTargets = null) {
  const targets = weeklyTargets ?? WEEKLY_TARGETS;
  const weekTarget = targets[weekNum - 1];
  if (!weekTarget) return [];
  const startDate = new Date(weekTarget.startDate);
  const result = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = toDateKey(d);
    if (weights[key]) result.push(weights[key]);
  }
  return result;
}

export function getBadgeInfo(badgeId, plan = null) {
  const badgeList = plan?.badges ?? BADGES;
  return badgeList.find(b => b.id === badgeId);
}
