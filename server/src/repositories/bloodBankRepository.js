import { query } from '../config/db.js';
import { calculateDistanceKm } from '../services/distanceService.js';

export const listBloodBanksWithInventory = async (bloodGroup) => {
  const result = await query(
    `SELECT bb.*, bi.blood_group, bi.units_available, bi.last_updated
     FROM blood_banks bb
     JOIN blood_inventory bi ON bi.blood_bank_id = bb.blood_bank_id
     WHERE bi.blood_group = $1 AND bi.units_available > 0`,
    [bloodGroup]
  );
  return result.rows;
};

export const findNearbyBloodBanks = async ({ latitude, longitude, bloodGroup, radiusKm = 30 }) => {
  const banks = await listBloodBanksWithInventory(bloodGroup);
  return banks
    .map((bank) => ({
      ...bank,
      distance_km: calculateDistanceKm(
        { latitude, longitude },
        { latitude: bank.latitude, longitude: bank.longitude }
      )
    }))
    .filter((bank) => bank.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);
};

export const getInventoryForBank = async (bloodBankId) => {
  const result = await query(
    `SELECT bb.name, bb.verified_status, bi.*
     FROM blood_banks bb
     JOIN blood_inventory bi ON bi.blood_bank_id = bb.blood_bank_id
     WHERE bb.blood_bank_id = $1
     ORDER BY bi.blood_group`,
    [bloodBankId]
  );
  return result.rows;
};

