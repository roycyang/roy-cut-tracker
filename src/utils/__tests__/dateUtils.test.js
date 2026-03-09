import { describe, it, expect } from 'vitest';
import { toDateKey, getCurrentWeek, getTrainingForDay, getWeekDateRange } from '../dateUtils';

describe('toDateKey', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 2, 2))).toBe('2026-03-02');
  });

  it('pads single-digit month and day', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('getCurrentWeek', () => {
  it('returns 1 for start date (Mar 2)', () => {
    expect(getCurrentWeek(new Date(2026, 2, 2))).toBe(1);
  });

  it('returns 1 for day before end of week 1', () => {
    expect(getCurrentWeek(new Date(2026, 2, 8))).toBe(1);
  });

  it('returns 2 for Mar 10', () => {
    expect(getCurrentWeek(new Date(2026, 2, 10))).toBe(2);
  });

  it('returns 1 for dates before start', () => {
    expect(getCurrentWeek(new Date(2026, 1, 28))).toBe(1);
  });

  it('caps at 10', () => {
    expect(getCurrentWeek(new Date(2026, 5, 1))).toBe(10);
  });
});

describe('getTrainingForDay', () => {
  it('returns Rest on Sunday in weeks 1-6', () => {
    // Mar 8, 2026 is a Sunday in week 1
    const result = getTrainingForDay(new Date(2026, 2, 8));
    expect(result.type).toBe('Rest');
    expect(result.emoji).toBe('😴');
  });

  it('returns Lift on Monday in weeks 1-6', () => {
    const result = getTrainingForDay(new Date(2026, 2, 2)); // Mon
    expect(result.type).toBe('Lift');
  });

  it('returns Core on Tuesday in weeks 1-6', () => {
    const result = getTrainingForDay(new Date(2026, 2, 3)); // Tue
    expect(result.type).toBe('Core');
  });

  it("returns Barry's on Wednesday in weeks 7-10", () => {
    // Apr 15, 2026 is a Wednesday in week 7
    const result = getTrainingForDay(new Date(2026, 3, 15));
    expect(result.type).toBe("Barry's");
    expect(result.emoji).toBe('🔥');
  });

  it('returns Active Recovery on Sunday in weeks 7-10', () => {
    const result = getTrainingForDay(new Date(2026, 3, 19)); // Sun week 7
    expect(result.type).toBe('Active Recovery');
  });
});

describe('getWeekDateRange', () => {
  it('returns correct range for week 1', () => {
    const { start, end } = getWeekDateRange(1);
    expect(toDateKey(start)).toBe('2026-03-02');
    expect(toDateKey(end)).toBe('2026-03-08');
  });

  it('returns correct range for week 2', () => {
    const { start, end } = getWeekDateRange(2);
    expect(toDateKey(start)).toBe('2026-03-09');
    expect(toDateKey(end)).toBe('2026-03-15');
  });
});
