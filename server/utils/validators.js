import { z } from 'zod';

// Auth Validators
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['owner', 'staff']).default('owner'),
  firmDetails: z
    .object({
      firmName: z.string().min(2).optional(),
      address: z.string().optional(),
      logo: z.string().url().optional()
    })
    .optional()
});

// Service Validators
export const serviceSchema = z.object({
  name: z.string().min(3, 'Service name must be at least 3 characters'),
  code: z
    .string()
    .min(2, 'Service code required')
    .regex(/^[A-Z0-9\-]+$/, 'Code must be uppercase alphanumeric with hyphens'),
  category: z.enum(['GST', 'TDS', 'Income Tax', 'ROC', 'Audit', 'Advisory', 'Other']),
  defaultPrice: z
    .number()
    .positive('Price must be greater than 0')
    .finite('Price must be a valid number'),
  billingCycle: z.enum(['monthly', 'quarterly', 'half_yearly', 'annual', 'one_time']),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
});

// Client Validators
export const clientSchema = z.object({
  name: z.string().min(2, 'Client name required'),
  firmName: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email'),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{10,}$/, 'Invalid phone format')
    .optional(),
  whatsapp: z
    .string()
    .regex(/^\+?[0-9]{10,}$/, 'Invalid WhatsApp number')
    .optional(),
  gstin: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format')
    .optional()
    .or(z.literal('')),
  pan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format')
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z
    .string()
    .regex(/^[0-9]{6}$/, 'Pincode must be 6 digits')
    .optional(),
  status: z.enum(['active', 'inactive', 'onboarding']).default('onboarding'),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// ClientService Validators
export const clientServiceSchema = z.object({
  clientId: z.string().min(24, 'Valid client ID required'),
  serviceId: z.string().min(24, 'Valid service ID required'),
  customPrice: z.number().positive().optional(),
  billingCycle: z.enum(['monthly', 'quarterly', 'half_yearly', 'annual', 'one_time']).optional(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()).optional(),
  isActive: z.boolean().default(true)
});

/**
 * Shared list query validation (clients, services, billings, payments, …).
 * Keep `limit` high enough for dashboard/reports bulk fetches (UI uses up to 2000).
 * Include optional filters used by list controllers so Zod does not strip them.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(5000).default(20),
  search: z.string().optional(),
  sortBy: z.string().default('-createdAt'),
  status: z.string().optional(),
  city: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  service: z.string().optional(),
  clientId: z.string().optional(),
  mode: z.string().optional(),
  fy: z.string().optional(),
  month: z.coerce.number().int().min(1).max(12).optional()
});

