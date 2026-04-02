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
 * 1. Promise-based initialization guard (No race conditions).
 * 2. Unified error handling.
 * 3. Reactive Store communication.
 */
export class IAPService {
  private static _initPromise: Promise<boolean> | null = null;
  private static _isInitialized = false;

  /**
   * Internal initialization logic.
   */
  private static async _doInit(): Promise<boolean> {
    try {
      console.log('[IAPService] Starting native store connection...');
      const success = await IAP.initConnection();
      
      if (success && Platform.OS === 'android') {
        // Minor stabilization delay for Android Billing Bridge
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      this._isInitialized = !!success;
      console.log('[IAPService] Initialization result:', this._isInitialized);
      return this._isInitialized;
    } catch (error) {
      console.error('[IAPService] Native initialization failed:', error);
      this._initPromise = null; // Allow retry on failure
      return false;
    }
  }

  /**
   * Public initialization method. 
   * Returns a shared promise ensuring only one connection attempt exists at any time.
   */
  static async init(): Promise<boolean> {
    if (this._isInitialized) return true;
    if (this._initPromise) return this._initPromise;

    this._initPromise = this._doInit();
    return this._initPromise;
  }

  /**
   * Internal guard to ensure the store is ready before any data request.
   */
  private static async ensureReady(): Promise<void> {
    const ready = await this.init();
    if (!ready) throw new Error('Billing client not ready');
  }

  /**
   * Fetches products from the store with internal readiness guard.
   */
  static async getProducts(skus: string[]): Promise<IAPProduct[]> {
    await this.ensureReady();
    
    console.log('[IAPService] Fetching products:', skus);
    try {
      if (skus.length === 0) return [];
      
      const products = await IAP.fetchProducts({ skus, type: "all" });
      console.log('[IAPService] Store returned:', products?.length || 0, 'products');

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
      console.error('[IAPService] Product fetch failed:', error);
      throw error;
    }
  }

  /**
   * Fetches the user's current valid entitlements from the store.
   */
  static async getActivePurchases(): Promise<IAP.Purchase[]> {
    await this.ensureReady();
    
    try {
      const result = await IAP.getAvailablePurchases();
      // expo-iap has a known typing quirk where it might return void or array
      return (result as unknown as IAP.Purchase[]) || [];
    } catch (error) {
       console.error('[IAPService] Entitlement fetch failed:', error);
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
        }
      } catch (error) {
        console.error('[IAPService] Failed to open management URL:', error);
      }
    }
  }

  /**
   * Cleanly closes the store connection.
   */
  static async shutdown() {
    try {
      await IAP.endConnection();
      this._isInitialized = false;
      this._initPromise = null;
    } catch (error) {
      console.error('[IAPService] Shutdown failed:', error);
    }
  }
}
