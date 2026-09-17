import { matchingConfig } from '../config/matchingConfig.js';

export const donationRecencyScore = (lastDonationDate) => {
  if (!lastDonationDate) return 70;
  const daysSince =
    (Date.now() - new Date(lastDonationDate).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= matchingConfig.minDonationIntervalDays ? 100 : 0;
};

export const isPreliminarilyEligible = (donor, existingMatch = null) => {
  if (donor.account_status !== 'ACTIVE') return false;
  if (donor.availability_status !== 'AVAILABLE') return false;
  if (!donor.location_captured_at) return false;
  const locationAgeMinutes = (Date.now() - new Date(donor.location_captured_at).getTime()) / 60000;
  if (!Number.isFinite(locationAgeMinutes) || locationAgeMinutes > matchingConfig.locationMaxAgeMinutes) return false;
  if (existingMatch?.donor_response && existingMatch.donor_response !== 'PENDING') return false;
  return donationRecencyScore(donor.last_donation_date) > 0;
};
