import { describe, expect, it } from 'vitest';
import { donationRecencyScore, isPreliminarilyEligible } from '../services/eligibilityService.js';
import { matchingConfig } from '../config/matchingConfig.js';

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

  it('rejects a donor immediately after a completed donation', () => {
    expect(isPreliminarilyEligible(donor({
      last_donation_date: new Date().toISOString().slice(0, 10)
    }))).toBe(false);
  });

  it('rejects a donor before the eight-week interval is complete', () => {
    const date = new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    expect(donationRecencyScore(date)).toBe(0);
  });

  it('accepts a donor after the eight-week interval is complete', () => {
    const date = new Date(Date.now() - 57 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    expect(matchingConfig.minDonationIntervalDays).toBe(56);
    expect(donationRecencyScore(date)).toBe(100);
  });
});
