import axios from 'axios';

interface CustomValue {
  id: string;
  key: string;
  value: string;
  locationId: string;
}

interface CustomValuesResponse {
  customValues?: CustomValue[];
}

interface SaveResult {
  created?: boolean;
  updated?: boolean;
  data: CustomValue;
}

class CustomValuesService {
  private readonly baseUrl = 'https://services.leadconnectorhq.com';
  private readonly version = '2021-07-28';

  /**
   * Get authorization headers for GHL API
   */
  private authHeaders(accessToken: string) {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Version': this.version,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get all custom values for a location
   */
  async getCustomValues(accessToken: string, locationId: string): Promise<CustomValue[]> {
    try {
      const response = await axios.get<CustomValuesResponse>(
        `${this.baseUrl}/locations/${locationId}/customValues`,
        { headers: this.authHeaders(accessToken) }
      );

      return response.data.customValues || [];
    } catch (error) {
      console.error('Failed to get custom values:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`GHL API Error: ${error.response?.data?.message || error.message}`);
      }
      throw new Error('Failed to fetch custom values');
    }
  }

  /**
   * Create a new custom value
   */
  async createCustomValue(
    accessToken: string,
    locationId: string,
    key: string,
    value: string
  ): Promise<CustomValue> {
    try {
      const response = await axios.post<CustomValue>(
        `${this.baseUrl}/locations/${locationId}/customValues`,
        { name: key, value },
        { headers: this.authHeaders(accessToken) }
      );

      console.log(`Custom value created: ${key} for location ${locationId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to create custom value:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`GHL API Error: ${error.response?.data?.message || error.message}`);
      }
      throw new Error('Failed to create custom value');
    }
  }

  /**
   * Update an existing custom value
   */
  async updateCustomValue(
    accessToken: string,
    locationId: string,
    id: string,
    key: string,
    value: string
  ): Promise<CustomValue> {
    try {
      const response = await axios.put<CustomValue>(
        `${this.baseUrl}/locations/${locationId}/customValues/${id}`,
        { name: key, value },
        { headers: this.authHeaders(accessToken) }
      );

      console.log(`Custom value updated: ${key} for location ${locationId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to update custom value:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`GHL API Error: ${error.response?.data?.message || error.message}`);
      }
      throw new Error('Failed to update custom value');
    }
  }

  /**
   * Save or update Google Review Link
   * Creates if doesn't exist, updates if exists
   */
  async saveGoogleReviewLink(
    accessToken: string,
    locationId: string,
    link: string
  ): Promise<SaveResult> {
    const customValues = await this.getCustomValues(accessToken, locationId);
    const existing = customValues.find(cv => cv.key === 'AVALINX_GMB_REVIEW_LINK');

    if (existing) {
      const data = await this.updateCustomValue(
        accessToken,
        locationId,
        existing.id,
        'AVALINX_GMB_REVIEW_LINK',
        link
      );
      return { updated: true, data };
    } else {
      const data = await this.createCustomValue(
        accessToken,
        locationId,
        'AVALINX_GMB_REVIEW_LINK',
        link
      );
      return { created: true, data };
    }
  }

  /**
   * Get Google Review Link from custom values
   */
  async getGoogleReviewLink(
    accessToken: string,
    locationId: string
  ): Promise<string | null> {
    const customValues = await this.getCustomValues(accessToken, locationId);
    const existing = customValues.find(cv => cv.key === 'AVALINX_GMB_REVIEW_LINK');
    return existing ? existing.value : null;
  }
}

export const customValuesService = new CustomValuesService();
