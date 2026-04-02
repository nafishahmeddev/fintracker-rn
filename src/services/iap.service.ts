import * as IAP from 'expo-iap';
import { Linking, Platform } from 'react-native';

/**
 * Standardized IAP Product interface to ensure consistency across platforms.
 */
export interface IAPProduct {
  /** Unique product identifier (SKU) */
  id: string;
  /** Fully formatted localized price string including currency symbol (e.g., "$9.99") */
  displayPrice: string;
  /** Optional formatted original price for strike-through display (e.g., "$19.99") */
  originalPrice?: string;
  /** Product title from the native store */
  title: string;
  /** Product description from the native store */
  description: string;
}

/**
 * IAPService: A clean encapsulation of store interactions with 'Self-Healing' connectivity.
 * 
 * Features:
 * 1. Concurrent Safety: Shared initialization promise prevents redundant connection attempts.
 * 2. Self-Healing: Automatically detects and repairs stale native bridge connections.
 * 3. Simplified API: Returns localized and standardized Product objects.
 */
export class IAPService {
  private static _initPromise: Promise<boolean> | null = null;
  private static _isInitialized = false;

  /**
   * Internal logic to establish the native store bridge.
   * Uses expo-iap's initConnection and manages singleton state.
   */
  private static async _doInit(): Promise<boolean> {
    try {
      const success = await IAP.initConnection();
      this._isInitialized = !!success;
      return this._isInitialized;
    } catch (error) {
      console.error('[IAPService] Bridge connection failed:', error instanceof Error ? error.message : error);
      this._initPromise = null;
      return false;
    }
  }

  /**
   * Initializes the native IAP bridge if necessary.
   * Ensures that multiple concurrent calls result in only one connection attempt.
   * 
   * @returns A promise resolving to true if context was successfully established.
   */
  static async init(): Promise<boolean> {
    if (this._isInitialized) return true;
    if (this._initPromise) return this._initPromise;

    this._initPromise = this._doInit();
    return this._initPromise;
  }

  /**
   * Robust wrapper for all native store operations.
   * Transparently handles 'Billing client not ready' errors by re-establishing 
   * the connection exactly once before second attempt.
   * 
   * @param action The store operation to execute.
   * @returns The result of the store operation.
   */
  private static async execute<T>(action: () => Promise<T>): Promise<T> {
    const ready = await this.init();
    if (!ready) throw new Error('Store interface unavailable');

    try {
      return await action();
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // Handle known stale connection scenarios (typically on Android during backgrounding)
      if (errorMsg.includes('Billing client not ready') || errorMsg.includes('disconnected')) {
        this._isInitialized = false;
        this._initPromise = null;
        const reconnected = await this.init();
        
        if (reconnected) {
          return await action();
        }
      }
      throw error;
    }
  }

  /**
   * Fetches available products from Apple/Google with localized pricing.
   * 
   * @param skus List of product identifiers to fetch.
   * @returns Array of standardized IAPProduct objects.
   */
  static async getProducts(skus: string[]): Promise<IAPProduct[]> {
    if (skus.length === 0) return [];

    return this.execute(async () => {
      const products = await IAP.fetchProducts({ skus, type: "all" });
      
      if (products && products.length > 0) {
        return products.map(p => {
          let originalPrice: string | undefined;

          // Android provides specific discount metadata for 'strikethrough' pricing logic
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
   * Retrieves all verified available purchases for the current user.
   * 
   * @returns Array of confirmed Purchase objects.
   */
  static async getActivePurchases(): Promise<IAP.Purchase[]> {
    return this.execute(async () => {
      const result = await IAP.getAvailablePurchases();
      // Ensure specific Purchase typing from StoreKit/Play results
      return (result as unknown as IAP.Purchase[]) || [];
    });
  }

  /**
   * Links the user directly to the platform's native subscription management UI.
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
        console.error('[IAPService] Management shortcut unreachable:', error);
      }
    }
  }

  /**
   * Cleanly terminates the platform store connection.
   */
  static async shutdown(): Promise<void> {
    try {
      await IAP.endConnection();
      this._isInitialized = false;
      this._initPromise = null;
    } catch (error) {
      console.error('[IAPService] Termination failed:', error);
    }
  }
}
