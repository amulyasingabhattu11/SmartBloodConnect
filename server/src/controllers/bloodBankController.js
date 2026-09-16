import { getInventoryForBank, findNearbyBloodBanks } from '../repositories/bloodBankRepository.js';

export const nearbyBloodBanks = async (req, res) => {
  const banks = await findNearbyBloodBanks({
    latitude: Number(req.query.lat),
    longitude: Number(req.query.lng),
    bloodGroup: req.query.bloodGroup,
    radiusKm: Number(req.query.radiusKm || 30)
  });
  res.json({
    demo_data_notice: 'Inventory is demo data and must be verified directly with the blood bank.',
    banks
  });
};

export const bankInventory = async (req, res) => {
  const inventory = await getInventoryForBank(req.params.id);
  res.json({
    demo_data_notice: 'Inventory freshness is shown for demo purposes and is not guaranteed real-time availability.',
    inventory
  });
};

