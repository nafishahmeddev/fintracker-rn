import * as IAP from 'expo-iap';
import { Linking, Platform } from 'react-native';

/**
 * Standardized IAP Product interface to ensure consistency.
 */
export interface IAPProduct {
  id: string;
  displayPrice: string;
  originalPrice?: string;
  title: string;
  description: string;
}

/**
 * IAPService: A clean encapsulation of store interactions.
 * Features:
 * 1. Self-healing connection logic (No patches/delays).
 * 2. Promise-based initialization guard.
 */
export class IAPService {
  private static _initPromise: Promise<boolean> | null = null;
  private static _isInitialized = false;

  /**
   * Internal initialization logic.
   */
  private static async _doInit(): Promise<boolean> {
    try {
      console.log('[IAPService] Connecting to native store...');
      const success = await IAP.initConnection();
      this._isInitialized = !!success;
      return this._isInitialized;
    } catch (error) {
      console.error('[IAPService] Native initialization failed:', error);
      this._initPromise = null;
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
   * A "Self-Healing" wrapper for all native store calls.
   * If a call fails because the billing client isn't ready or was disconnected,
   * it transparently reconnects and tries again exactly once.
   */
  private static async execute<T>(action: () => Promise<T>): Promise<T> {
    const ready = await this.init();
    if (!ready) throw new Error('Billing client not ready');

    try {
      return await action();
    } catch (error: any) {
      // If the native bridge is not ready or out of sync, attempt a one-time healing reconnect
      const errorMsg = error?.message || '';
      if (errorMsg.includes('Billing client not ready') || errorMsg.includes('disconnected')) {
        console.warn('[IAPService] Connection stale, attempting self-heal...');
        
        // Reset state and reconnect
        this._isInitialized = false;
        this._initPromise = null;
        const reconnected = await this.init();
        
        if (reconnected) {
          // Re-try the action exactly once
          return await action();
        }
      }
      throw error;
    }
  }

  /**
   * Fetches products from the store with self-healing connection logic.
   */
  static async getProducts(skus: string[]): Promise<IAPProduct[]> {
    if (skus.length === 0) return [];

    return this.execute(async () => {
      console.log('[IAPService] Fetching products:', skus);
      const products = await IAP.fetchProducts({ skus, type: "all" });
      
      if (products && products.length > 0) {
        return products.map(p => {
          let originalPrice: string | undefined;

          // For Android, check if there's a discount offer to get the original/full price
          if (p.platform === 'android') {
            const offer = (p as any).discountOffers?.[0];
            if (offer?.fullPriceMicrosAndroid) {
              const fullPrice = parseFloat(offer.fullPriceMicrosAndroid) / 1000000;
              const currency = offer.currency || 'USD';
              originalPrice = new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency,
              }).format(fullPrice);
            }
          }

          return {
            id: p.id,
            displayPrice: p.displayPrice || '',
            originalPrice,
            title: p.title,
            description: p.description,
          };
        });
      }
      return [];
    });
  }

  /**
   * Fetches the user's current valid entitlements from the store.
   */
  static async getActivePurchases(): Promise<IAP.Purchase[]> {
    return this.execute(async () => {
      const result = await IAP.getAvailablePurchases();
      return (result as unknown as IAP.Purchase[]) || [];
    });
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
