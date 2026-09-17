const csvNumbers = (value, fallback) =>
  String(process.env[value] ?? fallback)
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);

const envNumber = (key, fallback) => Number(process.env[key] ?? fallback);

export const matchingConfig = {
  radiusStepsKm: csvNumbers('MATCH_RADIUS_STEPS_KM', '5,10,20,30'),
  batchSize: envNumber('MATCH_BATCH_SIZE', 5),
  extraCandidatesPerUnit: envNumber('MATCH_EXTRA_CANDIDATES_PER_UNIT', 4),
  minDonationIntervalDays: envNumber('MIN_DONATION_INTERVAL_DAYS', 90),
  locationMaxAgeMinutes: envNumber('MATCH_LOCATION_MAX_AGE_MINUTES', 60),
  weights: {
    distance: envNumber('MATCH_WEIGHT_DISTANCE', 0.4),
    recency: envNumber('MATCH_WEIGHT_RECENCY', 0.3),
    reliability: envNumber('MATCH_WEIGHT_RELIABILITY', 0.2),
    urgencyFit: envNumber('MATCH_WEIGHT_URGENCY_FIT', 0.1)
  }
};
