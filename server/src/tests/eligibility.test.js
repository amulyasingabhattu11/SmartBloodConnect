import { describe, expect, it } from 'vitest';
import { isPreliminarilyEligible } from '../services/eligibilityService.js';

const donor = (overrides = {}) => ({
  account_status: 'ACTIVE',
  availability_status: 'AVAILABLE',
  location_captured_at: new Date().toISOString(),
  last_donation_date: null,
  ...overrides
});

describe('preliminary donor eligibility', () => {
  it('accepts an available donor with a recent location capture', () => {
    expect(isPreliminarilyEligible(donor())).toBe(true);
  });

  it('rejects a stale location capture', () => {
    expect(isPreliminarilyEligible(donor({
      location_captured_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }))).toBe(false);
  });

  it('rejects donors without an explicit location capture', () => {
    expect(isPreliminarilyEligible(donor({ location_captured_at: null }))).toBe(false);
  });
});
