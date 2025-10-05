import { type GhlToken, type GhlAccount } from "@shared/schema";

export interface IStorage {
  // Token management
  saveToken(locationId: string, token: GhlToken): Promise<void>;
  getToken(locationId: string): Promise<GhlToken | undefined>;
  getAllTokens(): Promise<Map<string, GhlToken>>;
  deleteToken(locationId: string): Promise<void>;
  
  // Account management
  saveAccount(locationId: string, account: GhlAccount): Promise<void>;
  getAccount(locationId: string): Promise<GhlAccount | undefined>;
  deleteAccount(locationId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private tokens: Map<string, GhlToken>;
  private accounts: Map<string, GhlAccount>;

  constructor() {
    this.tokens = new Map();
    this.accounts = new Map();
  }

  async saveToken(locationId: string, token: GhlToken): Promise<void> {
    this.tokens.set(locationId, token);
  }

  async getToken(locationId: string): Promise<GhlToken | undefined> {
    return this.tokens.get(locationId);
  }

  async getAllTokens(): Promise<Map<string, GhlToken>> {
    return new Map(this.tokens);
  }

  async deleteToken(locationId: string): Promise<void> {
    this.tokens.delete(locationId);
  }

  async saveAccount(locationId: string, account: GhlAccount): Promise<void> {
    this.accounts.set(locationId, account);
  }

  async getAccount(locationId: string): Promise<GhlAccount | undefined> {
    return this.accounts.get(locationId);
  }

  async deleteAccount(locationId: string): Promise<void> {
    this.accounts.delete(locationId);
  }
}

export const storage = new MemStorage();
