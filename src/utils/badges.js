import { BADGES, XP_VALUES, WEEKLY_TARGETS } from '../data/config';
import { getCurrentWeek, toDateKey } from './dateUtils';
import { computeStreaks } from './streaks';

export function checkBadges(storage) {
  const { getWeights, getBadges, unlockBadge, addXP, getBarrysCount, getMealChecks, getSuppChecks, getBarrysAttendance } = storage;
  const newlyUnlocked = [];
  const today = new Date();
  const week = getCurrentWeek(today);
  const weights = getWeights();
  const streaks = computeStreaks(storage);
  const badges = getBadges();

  // First Blood: log weight on Day 1
  if (weights['2026-03-02'] && !badges.first_blood) {
    if (unlockBadge('first_blood')) {
      addXP(XP_VALUES.badgeUnlocked);
      newlyUnlocked.push('first_blood');
    }
  }

  // Week 1 Warrior
  if (week >= 2 && !badges.week1_warrior) {
    if (unlockBadge('week1_warrior')) {
      addXP(XP_VALUES.badgeUnlocked);
      newlyUnlocked.push('week1_warrior');
    }
  }

  // Halfway There
  if (week >= 6 && !badges.halfway) {
    if (unlockBadge('halfway')) {
      addXP(XP_VALUES.badgeUnlocked);
      newlyUnlocked.push('halfway');
    }
  }

  // Phase Shifter
  if (today >= new Date(2026, 3, 13) && !badges.phase_shifter) {
    if (unlockBadge('phase_shifter')) {
      addXP(XP_VALUES.badgeUnlocked);
      newlyUnlocked.push('phase_shifter');
    }
  }

  // Red Zone
  if (today >= new Date(2026, 3, 20) && !badges.red_zone) {
    if (unlockBadge('red_zone')) {
      addXP(XP_VALUES.badgeUnlocked);
      newlyUnlocked.push('red_zone');
    }
  }

  // Iron Will: 7-day meal streak
  if (streaks.meals >= 7 && !badges.iron_will) {
    if (unlockBadge('iron_will')) {
      addXP(XP_VALUES.badgeUnlocked);
      newlyUnlocked.push('iron_will');
    }
  }

  // Supplement King: 14-day supplement streak
  if (streaks.supplements >= 14 && !badges.supplement_king) {
    if (unlockBadge('supplement_king')) {
      addXP(XP_VALUES.badgeUnlocked);
      newlyUnlocked.push('supplement_king');
    }
  }

  // On Target
  if (!badges.on_target) {
    for (const wt of WEEKLY_TARGETS) {
      if (wt.week > week) break;
      const weekWeights = getWeightsForWeek(wt.week, weights);
      if (weekWeights.length > 0) {
        const avg = weekWeights.reduce((a, b) => a + b, 0) / weekWeights.length;
        if (avg <= wt.target) {
          if (unlockBadge('on_target')) {
            addXP(XP_VALUES.badgeUnlocked);
            newlyUnlocked.push('on_target');
          }
          break;
        }
      }
    }
  }

  // 5 for 5
  if (!badges.five_for_five) {
    let consecutive = 0;
    for (const wt of WEEKLY_TARGETS) {
      if (wt.week > week) break;
      const weekWeights = getWeightsForWeek(wt.week, weights);
      if (weekWeights.length > 0) {
        const avg = weekWeights.reduce((a, b) => a + b, 0) / weekWeights.length;
        consecutive = avg <= wt.target ? consecutive + 1 : 0;
        if (consecutive >= 5) {
          if (unlockBadge('five_for_five')) {
            addXP(XP_VALUES.badgeUnlocked);
            newlyUnlocked.push('five_for_five');
          }
          break;
        }
      } else {
        consecutive = 0;
      }
    }
  }

  // Barry's Beast
  if (getBarrysCount() >= 4 && !badges.barrys_beast) {
    if (unlockBadge('barrys_beast')) {
      addXP(XP_VALUES.badgeUnlocked);
      newlyUnlocked.push('barrys_beast');
    }
  }

  // Shredded
  if (!badges.shredded) {
    if (Object.values(weights).some(w => w <= 137.5)) {
      if (unlockBadge('shredded')) {
        addXP(XP_VALUES.badgeUnlocked + XP_VALUES.finalGoal);
        newlyUnlocked.push('shredded');
      }
    }
  }

  // The Full Cut
  if (today >= new Date(2026, 4, 10) && !badges.the_full_cut) {
    if (unlockBadge('the_full_cut')) {
      addXP(XP_VALUES.badgeUnlocked);
      newlyUnlocked.push('the_full_cut');
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

export function getWeightsForWeek(weekNum, weights) {
  const startDate = new Date(WEEKLY_TARGETS[weekNum - 1].startDate);
  const result = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = toDateKey(d);
    if (weights[key]) result.push(weights[key]);
  }
  return result;
}

export function getBadgeInfo(badgeId) {
  return BADGES.find(b => b.id === badgeId);
}
