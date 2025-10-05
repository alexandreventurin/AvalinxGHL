import axios from 'axios';
import { GhlToken, GhlAccount, ghlTokenSchema, ghlAccountSchema } from '@shared/schema';

class GHLService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly baseUrl = 'https://services.leadconnectorhq.com';
  private readonly authUrl = 'https://marketplace.gohighlevel.com/oauth/chooselocation';

  constructor() {
    this.clientId = process.env.GHL_CLIENT_ID || process.env.VITE_GHL_CLIENT_ID || '';
    this.clientSecret = process.env.GHL_CLIENT_SECRET || process.env.VITE_GHL_CLIENT_SECRET || '';
    this.redirectUri = process.env.GHL_REDIRECT_URI || process.env.VITE_GHL_REDIRECT_URI || 'http://localhost:5000/auth/callback';
    
    if (!this.clientId || !this.clientSecret) {
      console.warn('GHL OAuth credentials not found in environment variables');
    }
  }

  /**
   * Generate GoHighLevel OAuth authorization URL
   */
  getAuthUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'locations.readonly contacts.readonly'
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<GhlToken> {
    try {
      const response = await axios.post(`${this.baseUrl}/oauth/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const tokenData = {
        ...response.data,
        created_at: Date.now(),
        locationId: response.data.locationId || response.data.location_id || 'unknown'
      };

      console.log('Token exchange successful for location:', tokenData.locationId);
      
      return ghlTokenSchema.parse(tokenData);
    } catch (error) {
      console.error('Token exchange failed:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`GHL API Error: ${error.response?.data?.message || error.message}`);
      }
      throw new Error('Failed to exchange code for token');
    }
  }

  /**
   * Get user data from GoHighLevel API
   */
  async getUserData(accessToken: string, locationId: string): Promise<GhlAccount> {
    try {
      // Get specific location data by ID
      const response = await axios.get(`${this.baseUrl}/locations/${locationId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28'
        }
      });

      const locationData = response.data.location || response.data;

      const accountData = {
        locationId: locationData.id || locationId,
        companyId: locationData.companyId,
        name: locationData.name || locationData.businessName || 'Unknown Business',
        address: locationData.address,
        timezone: locationData.timezone,
        country: locationData.country
      };

      console.log('User data retrieved for:', accountData.name);
      
      return ghlAccountSchema.parse(accountData);
    } catch (error) {
      console.error('Failed to get user data:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`GHL API Error: ${error.response?.data?.message || error.message}`);
      }
      throw new Error('Failed to fetch user data from GoHighLevel');
    }
  }
}

export const ghlService = new GHLService();
