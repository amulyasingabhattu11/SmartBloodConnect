import { describe, expect, it } from 'vitest';
import { compatibleDonorGroupsForRecipient, isCompatibleForRbcDonation } from '../services/compatibilityService.js';

describe('blood compatibility', () => {
  it('allows O- to donate red cells to all groups', () => {
    expect(isCompatibleForRbcDonation('O-', 'AB+')).toBe(true);
    expect(isCompatibleForRbcDonation('O-', 'A-')).toBe(true);
  });

  it('does not allow AB+ to donate red cells to B+', () => {
    expect(isCompatibleForRbcDonation('AB+', 'B+')).toBe(false);
  });

  it('returns compatible donor groups for B+', () => {
    expect(compatibleDonorGroupsForRecipient('B+').sort()).toEqual(['B+', 'B-', 'O+', 'O-'].sort());
  });
});

