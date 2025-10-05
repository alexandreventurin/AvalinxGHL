import { z } from "zod";

// GHL OAuth Token schema
export const ghlTokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
  scope: z.string(),
  locationId: z.string(),
  companyId: z.string().optional(),
  created_at: z.number(), // timestamp
});

// GHL Account Info schema
export const ghlAccountSchema = z.object({
  locationId: z.string(),
  companyId: z.string().optional(),
  name: z.string(),
  address: z.string().optional(),
  timezone: z.string().optional(),
  country: z.string().optional(),
});

// API Response schemas
export const authCallbackResponseSchema = z.object({
  connected: z.boolean(),
  locationId: z.string(),
  access_token: z.string(),
});

export const apiStatusSchema = z.object({
  status: z.string(),
  version: z.string(),
  timestamp: z.number(),
});

// Employee Review Link schema
export const employeeLinkSchema = z.object({
  id: z.string(),
  employeeName: z.string(),
  locationId: z.string(),
  destination: z.string(),
  clicks: z.number(),
  createdAt: z.date(),
});

export const createEmployeeLinkSchema = z.object({
  employeeName: z.string().min(1, "Employee name is required"),
  locationId: z.string().min(1, "Location ID is required"),
});

export const employeeLinkResponseSchema = employeeLinkSchema.extend({
  shortUrl: z.string(),
});

export type GhlToken = z.infer<typeof ghlTokenSchema>;
export type GhlAccount = z.infer<typeof ghlAccountSchema>;
export type AuthCallbackResponse = z.infer<typeof authCallbackResponseSchema>;
export type ApiStatus = z.infer<typeof apiStatusSchema>;
export type EmployeeLink = z.infer<typeof employeeLinkSchema>;
export type CreateEmployeeLink = z.infer<typeof createEmployeeLinkSchema>;
export type EmployeeLinkResponse = z.infer<typeof employeeLinkResponseSchema>;
