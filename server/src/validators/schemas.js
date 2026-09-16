import { z } from 'zod';

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const URGENCY_LEVELS = ['NORMAL', 'URGENT', 'CRITICAL'];
export const REQUEST_STATUSES = ['OPEN', 'MATCHING', 'PARTIALLY_MATCHED', 'FULFILLED', 'CANCELLED', 'EXPIRED'];

const latitude = z.coerce.number().min(-90).max(90);
const longitude = z.coerce.number().min(-180).max(180);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(30),
  password: z.string().min(8).max(128)
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

export const donorProfileSchema = z.object({
  blood_group: z.enum(BLOOD_GROUPS),
  latitude,
  longitude,
  location_label: z.string().trim().min(2).max(255),
  last_donation_date: z.string().date().nullable().optional(),
  availability_status: z.enum(['AVAILABLE', 'UNAVAILABLE', 'TEMP_DISABLED']).default('AVAILABLE')
});

export const availabilitySchema = z.object({
  availability_status: z.enum(['AVAILABLE', 'UNAVAILABLE', 'TEMP_DISABLED'])
});

export const bloodRequestSchema = z.object({
  patient_reference: z.string().trim().min(2).max(120),
  required_blood_group: z.enum(BLOOD_GROUPS),
  hospital_name: z.string().trim().min(2).max(180),
  hospital_address: z.string().trim().min(2),
  latitude,
  longitude,
  units_required: z.coerce.number().int().min(1).max(20),
  urgency: z.enum(URGENCY_LEVELS),
  required_before: z.string().datetime(),
  note: z.string().trim().max(1000).optional().nullable()
});

export const requestStatusSchema = z.object({
  status: z.enum(REQUEST_STATUSES)
});

