import * as IAP from 'expo-iap';

/**
 * Standardized IAP Product interface to ensure consistency.
 */
export interface IAPProduct {
  id: string;
  displayPrice: string;
  priceAmount: number;
  currencySymbol: string;
  title: string;
  description: string;
}

/**
 * IAPService: A clean encapsulation of store interactions.
 * Features:
 * 1. Unified error handling.
 * 2. High-fidelity Mock Mode for development builds.
 * 3. Platform-agnostic method signatures.
 */
export class IAPService {
  private static isInitialized = false;

  /**
   * Initializes the connection to the store.
   * Returns true if successful, false otherwise.
   */
  static async init(): Promise<boolean> {
    try {
      if (this.isInitialized) return true;
      const connected = await IAP.initConnection();
      this.isInitialized = connected;
      return connected;
    } catch (error) {
      console.error('[IAPService] init error:', error);
      return false;
    }
  }

  /**
   * Fetches products from the store.
   */
  static async getProducts(skus: string[]): Promise<IAPProduct[]> {
    try {
      const products = await IAP.fetchProducts({ skus });
      
      if (products && products.length > 0) {
        return products.map(p => ({
          id: p.id,
          displayPrice: p.displayPrice,
          priceAmount: parseFloat(p.displayPrice.replace(/[^0-9.]/g, '')) || 0,
          currencySymbol: p.displayPrice.replace(/[0-9.,]/g, '').trim(),
          title: p.title,
          description: p.description,
        }));
      }

      return [];
    } catch (error) {
      console.error('[IAPService] getProducts error:', error);
      throw error;
    }
  }

  /**
   * Cleans up listener and connection resource.
   */
  static async shutdown() {
    try {
      await IAP.endConnection();
      this.isInitialized = false;
    } catch (error) {
      console.error('[IAPService] shutdown error:', error);
    }
  }
}
