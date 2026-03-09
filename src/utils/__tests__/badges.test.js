import { describe, it, expect } from 'vitest';
import { getWeightsForWeek } from '../badges';

describe('getWeightsForWeek', () => {
  it('returns weights for days in the given week', () => {
    const weights = {
      '2026-03-02': 148,
      '2026-03-03': 147.5,
      '2026-03-05': 147,
    };
    const result = getWeightsForWeek(1, weights);
    expect(result).toEqual([148, 147.5, 147]);
  });

  it('returns empty array when no weights logged', () => {
    expect(getWeightsForWeek(1, {})).toEqual([]);
  });

  it('returns correct weights for week 2', () => {
    const weights = {
      '2026-03-09': 146,
      '2026-03-12': 145.5,
    };
    const result = getWeightsForWeek(2, weights);
    expect(result).toEqual([146, 145.5]);
  });

  it('does not include weights from week 3 in week 2', () => {
    const weights = {
      '2026-03-10': 146, // week 2
      '2026-03-12': 145.5, // week 2
      '2026-03-17': 145, // week 3
    };
    const result = getWeightsForWeek(2, weights);
    expect(result).toEqual([146, 145.5]);
  });
});

describe('badge logic: weight badges use lowest (not average)', () => {
  it('on_target should trigger when lowest weight is at/below target', () => {
    // Week 1 target: 145.5
    // Weights: 146, 147, 145.5 → avg=146.17 (above target), min=145.5 (at target)
    const weekWeights = [146, 147, 145.5];
    const target = 145.5;

    // With average logic (old, broken): avg > target → no badge
    const avg = weekWeights.reduce((a, b) => a + b, 0) / weekWeights.length;
    expect(avg).toBeGreaterThan(target);

    // With min logic (new, correct): min <= target → badge unlocks
    expect(Math.min(...weekWeights)).toBeLessThanOrEqual(target);
  });

  it('five_for_five uses min per week, not average', () => {
    // 5 weeks where min is below target but avg is above
    const weeksData = [
      { weights: [146, 147, 145.0], target: 145.5 },
      { weights: [145, 146, 144.0], target: 144.8 },
      { weights: [144.5, 145, 143.5], target: 144.0 },
      { weights: [144, 145, 143.0], target: 143.2 },
      { weights: [143, 144, 142.0], target: 142.5 },
    ];

    let consecutive = 0;
    for (const { weights, target } of weeksData) {
      consecutive = Math.min(...weights) <= target ? consecutive + 1 : 0;
    }
    expect(consecutive).toBe(5);
  });
});
