import { storage } from '../storage';
import { GhlToken } from '@shared/schema';

/**
 * Utility functions for token management
 * These wrap the storage interface for easier usage
 */

export async function saveToken(locationId: string, tokenData: GhlToken): Promise<void> {
  try {
    await storage.saveToken(locationId, tokenData);
    console.log(`Token saved for location: ${locationId}`);
  } catch (error) {
    console.error(`Failed to save token for location ${locationId}:`, error);
    throw new Error('Failed to save authentication token');
  }
}

export async function getToken(locationId: string): Promise<GhlToken | undefined> {
  try {
    return await storage.getToken(locationId);
  } catch (error) {
    console.error(`Failed to get token for location ${locationId}:`, error);
    return undefined;
  }
}

export async function getAllTokens(): Promise<Map<string, GhlToken>> {
  try {
    return await storage.getAllTokens();
  } catch (error) {
    console.error('Failed to get all tokens:', error);
    return new Map();
  }
}

export async function deleteToken(locationId: string): Promise<void> {
  try {
    await storage.deleteToken(locationId);
    console.log(`Token deleted for location: ${locationId}`);
  } catch (error) {
    console.error(`Failed to delete token for location ${locationId}:`, error);
    throw new Error('Failed to delete authentication token');
  }
}

export async function isTokenValid(locationId: string): Promise<boolean> {
  try {
    const token = await getToken(locationId);
    if (!token) return false;

    const now = Date.now();
    const tokenAge = now - token.created_at;
    const expiresInMs = token.expires_in * 1000;

    return tokenAge < expiresInMs;
  } catch (error) {
    console.error(`Failed to validate token for location ${locationId}:`, error);
    return false;
  }
}
