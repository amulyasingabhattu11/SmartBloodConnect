export const rbcCompatibility = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
};

export const isCompatibleForRbcDonation = (donorBloodGroup, recipientBloodGroup) =>
  Boolean(rbcCompatibility[donorBloodGroup]?.includes(recipientBloodGroup));

export const compatibleDonorGroupsForRecipient = (recipientBloodGroup) =>
  Object.entries(rbcCompatibility)
    .filter(([, recipients]) => recipients.includes(recipientBloodGroup))
    .map(([donorGroup]) => donorGroup);

