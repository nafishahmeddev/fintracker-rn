import * as IAP from 'expo-iap';
import { Linking, Platform } from 'react-native';

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
 * 2. Real-time store communication.
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
      console.log('[IAPService] Calling IAP.initConnection()...');
      if (this.isInitialized) {
        console.log('[IAPService] Already initialized.');
        return true;
      }
      const connected = await IAP.initConnection();
      console.log('[IAPService] IAP.initConnection() result:', connected);
      this.isInitialized = !!connected;
      return !!connected;
    } catch (error) {
      console.error('[IAPService] init error:', error);
      return false;
    }
  }

  /**
   * Fetches products from the store.
   */
  static async getProducts(skus: string[]): Promise<IAPProduct[]> {
    console.log('[IAPService] getProducts() called for SKUs:', skus);
    try {
      if (skus.length === 0) {
        console.warn('[IAPService] getProducts() called with empty SKUs list.');
        return [];
      }
      console.log('[IAPService] Calling IAP.fetchProducts()...');
      const products = await IAP.fetchProducts({ skus, type: "all" });
      console.log('[IAPService] IAP.fetchProducts() raw result:', products?.length || 0, 'items');

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
   * Opens the platform's native subscription management screen.
   */
  static async manage(): Promise<void> {
    const url = Platform.select({
      ios: 'https://apps.apple.com/account/subscriptions',
      android: 'https://play.google.com/store/account/subscriptions?package=me.nafish.luno',
    });
    
    if (url) {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          console.error('[IAPService] Cannot open URL:', url);
        }
      } catch (error) {
        console.error('[IAPService] Error opening management URL:', error);
      }
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
