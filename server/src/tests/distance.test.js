import { describe, expect, it } from 'vitest';
import { calculateDistanceKm } from '../services/distanceService.js';

describe('distance calculation', () => {
  it('returns zero for the same coordinate', () => {
    expect(calculateDistanceKm({ latitude: 17.44, longitude: 78.39 }, { latitude: 17.44, longitude: 78.39 })).toBe(0);
  });

  it('calculates a plausible Hyderabad city distance', () => {
    const distance = calculateDistanceKm({ latitude: 17.44, longitude: 78.39 }, { latitude: 17.50, longitude: 78.39 });
    expect(distance).toBeGreaterThan(6);
    expect(distance).toBeLessThan(8);
  });
});

