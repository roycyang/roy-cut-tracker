import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeStreaks, getStreakClass } from '../streaks';
import { toDateKey } from '../dateUtils';

function mockDate(year, month, day) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(year, month, day, 12, 0, 0));
}

afterEach(() => {
  vi.useRealTimers();
});

describe('computeStreaks', () => {
  it('returns 0 for all streaks when no data exists', () => {
    mockDate(2026, 2, 5);
    const storage = {
      getWeights: () => ({}),
      getMealChecks: () => ({}),
      getSuppChecks: () => ({}),
    };
    const result = computeStreaks(storage);
    expect(result).toEqual({ logging: 0, meals: 0, supplements: 0 });
  });

  it('counts consecutive days of weight logging backward from today', () => {
    mockDate(2026, 2, 5);
    const storage = {
      getWeights: () => ({
        '2026-03-05': 147,
        '2026-03-04': 147.5,
        '2026-03-03': 148,
        // gap on 03-02
      }),
      getMealChecks: () => ({}),
      getSuppChecks: () => ({}),
    };
    const result = computeStreaks(storage);
    expect(result.logging).toBe(3);
  });

  it('counts consecutive days of all 3 meals checked', () => {
    mockDate(2026, 2, 4);
    const mealData = {
      '2026-03-04': { meal1: true, meal2: true, meal3: true },
      '2026-03-03': { meal1: true, meal2: true, meal3: true },
      '2026-03-02': { meal1: true, meal2: false, meal3: true }, // broken streak
    };
    const storage = {
      getWeights: () => ({}),
      getMealChecks: (key) => mealData[key] || {},
      getSuppChecks: () => ({}),
    };
    const result = computeStreaks(storage);
    expect(result.meals).toBe(2);
  });

  it('counts consecutive days of all 4 supplements checked', () => {
    mockDate(2026, 2, 4);
    const suppData = {
      '2026-03-04': { preworkout: true, creatine: true, whey: true, collagen: true },
      '2026-03-03': { preworkout: true, creatine: true, whey: true, collagen: true },
    };
    const storage = {
      getWeights: () => ({}),
      getMealChecks: () => ({}),
      getSuppChecks: (key) => suppData[key] || {},
    };
    const result = computeStreaks(storage);
    expect(result.supplements).toBe(2);
  });

  it('breaks supplement streak if any supplement is missing', () => {
    mockDate(2026, 2, 4);
    const suppData = {
      '2026-03-04': { preworkout: true, creatine: true, whey: true, collagen: false },
    };
    const storage = {
      getWeights: () => ({}),
      getMealChecks: () => ({}),
      getSuppChecks: (key) => suppData[key] || {},
    };
    const result = computeStreaks(storage);
    expect(result.supplements).toBe(0);
  });
});

describe('getStreakClass', () => {
  it('returns gold animation for streak >= 7', () => {
    expect(getStreakClass(7)).toBe('animate-pulse-gold');
    expect(getStreakClass(14)).toBe('animate-pulse-gold');
  });

  it('returns orange animation for streak >= 3', () => {
    expect(getStreakClass(3)).toBe('animate-glow-orange');
    expect(getStreakClass(6)).toBe('animate-glow-orange');
  });

  it('returns empty string for streak < 3', () => {
    expect(getStreakClass(0)).toBe('');
    expect(getStreakClass(2)).toBe('');
  });
});
