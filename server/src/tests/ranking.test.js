import { describe, expect, it } from 'vitest';
import { calculatePriorityScore } from '../services/rankingService.js';

describe('candidate priority score', () => {
  it('scores closer reliable donors higher', () => {
    const donor = {
      last_donation_date: '2025-01-01',
      response_count: 10,
      accept_count: 9,
      availability_status: 'AVAILABLE'
    };
    const close = calculatePriorityScore({ donor, distanceKm: 2, radiusKm: 10 });
    const far = calculatePriorityScore({ donor, distanceKm: 9, radiusKm: 10 });
    expect(close).toBeGreaterThan(far);
  });

  it('keeps scores between 0 and 100', () => {
    const score = calculatePriorityScore({
      donor: { last_donation_date: null, response_count: 0, accept_count: 0, availability_status: 'AVAILABLE' },
      distanceKm: 100,
      radiusKm: 10
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

