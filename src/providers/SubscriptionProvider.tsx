import AsyncStorage from '@react-native-async-storage/async-storage';
import * as IAP from 'expo-iap';
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { Alert } from 'react-native';
import { ALL_SKUS, SKU_LIFETIME, SKU_MONTHLY, SKU_YEARLY } from '../constants/iap';

/**
 * Supported subscription plans in the Luno ecosystem.
 * MONTHLY: Recurring monthly access.
 * YEARLY: Recurring yearly access (best value).
 * LIFETIME: One-time purchase for permanent access.
 */
export type PlanType = 'MONTHLY' | 'YEARLY' | 'LIFETIME';

/**
 * Internal state representation of the user's subscription status.
 * This object is persisted locally to ensure offline resilience.
 */
export interface SubscriptionState {
  /** True if the user has an active Pro subscription or lifetime access. */
  isPremium: boolean;
  /** The tier of the current plan. */
  planType: PlanType | null;
  /** ISO timestamp of when the purchase was originally made. */
  purchasedAt: string | null;
  /** ISO timestamp of subscription expiration (null for Lifetime). */
  expiresAt: string | null;
}

/**
 * Context type defining the public API for the Subscription system.
 */
type SubscriptionContextType = {
  /** Reactive current state of the subscription. */
  subscription: SubscriptionState;
  /** List of available products fetched from the store. */
  products: IAP.Product[];
  /** Derived boolean for convenient premium gating. */
  isPremium: boolean;
  /** True while the store connection or local loading is in progress. */
  isLoading: boolean;
  /** Initiates a purchase flow for a specific plan tier. */
  purchasePlan: (plan: PlanType) => Promise<void>;
  /** Restores previous purchases to synchronize state. */
  restorePurchase: () => Promise<void>;
  /** For development use only: resets the subscription to free tier. */
  resetSubscription: () => Promise<void>;
};

export const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

/**
 * Hook to access the subscription context.
 * Must be used within a SubscriptionProvider.
 */
export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}

const STORAGE_KEY = '@luno_subscription_v4';

const INITIAL_STATE: SubscriptionState = {
  isPremium: false,
  planType: null,
  purchasedAt: null,
  expiresAt: null,
};

/**
 * Provider component that manages the Luno Pro subscription lifecycle.
 * Features:
 * 1. Offline Resilience: Always loads from local cache first.
 * 2. Auto-Sync: Reconciles with Apple/Google store on every app launch.
 * 3. Grace Period: 3-day buffer for renewals to account for store delays.
 * 4. Robust Restoration: Hand-tailored restore logic with transaction finalization.
 */
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionState>(INITIAL_STATE);
  const [products, setProducts] = useState<IAP.Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIapInitialized, setIsIapInitialized] = useState(false);

  /**
   * Persists the subscription state to local storage and updates reactive state.
   */
  const saveSubscription = useCallback(async (newState: SubscriptionState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setSubscription(newState);
    } catch (error) {
      console.error('[Subscription] Failed to persist state:', error);
    }
  }, []);

  /**
   * Processes a successful transaction and updates the local state with calculated expiration.
   * Includes a 3-day grace period for subscription processing.
   */
  const handlePurchaseSuccess = useCallback(async (purchase: IAP.Purchase) => {
    const sku = purchase.productId;
    const now = new Date();
    let planType: PlanType | null = null;
    let expiresAt: string | null = null;

    if (sku === SKU_MONTHLY) {
      planType = 'MONTHLY';
      const exp = new Date(purchase.transactionDate || now.getTime());
      exp.setMonth(exp.getMonth() + 1);
      exp.setDate(exp.getDate() + 3); // 3-day buffer
      expiresAt = exp.toISOString();
    } else if (sku === SKU_YEARLY) {
      planType = 'YEARLY';
      const exp = new Date(purchase.transactionDate || now.getTime());
      exp.setFullYear(exp.getFullYear() + 1);
      exp.setDate(exp.getDate() + 3); // 3-day buffer
      expiresAt = exp.toISOString();
    } else if (sku === SKU_LIFETIME) {
      planType = 'LIFETIME';
      expiresAt = null;
    }

    if (planType) {
      const newState: SubscriptionState = {
        isPremium: true,
        planType,
        purchasedAt: new Date(purchase.transactionDate || now.getTime()).toISOString(),
        expiresAt,
      };
      await saveSubscription(newState);
    }
  }, [saveSubscription]);

  /**
   * Reconciles local state with the store's current active purchases.
   * If offline, it gracefully fails while keeping the locally cached status.
   */
  const syncSubscriptionStatus = useCallback(async () => {
    try {
      const available = await IAP.getAvailablePurchases();
      const casted = (available as unknown as IAP.Purchase[]) || [];
      
      if (casted.length > 0) {
        const sortedByTier = [...casted].sort((a, b) => {
          const tierVal = (skuIdentifier: string) => {
            if (skuIdentifier === SKU_LIFETIME) return 3;
            if (skuIdentifier === SKU_YEARLY) return 2;
            if (skuIdentifier === SKU_MONTHLY) return 1;
            return 0;
          };
          return tierVal(b.productId) - tierVal(a.productId);
        });

        const activePurchase = sortedByTier[0];
        if (activePurchase) {
          await handlePurchaseSuccess(activePurchase);
          return;
        }
      }

      // Cleanup local state if store confirms no active subscriptions (online only)
      setSubscription(prev => {
        if (prev.isPremium && prev.planType !== 'LIFETIME') {
          const isActuallyExpired = prev.expiresAt && new Date(prev.expiresAt) < new Date();
          if (isActuallyExpired) {
            const expiredState = { ...INITIAL_STATE };
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expiredState)).catch(() => {});
            return expiredState;
          }
        }
        return prev;
      });
    } catch (error) {
      // Offline or network error: we do nothing and rely on the locally loaded cache.
      console.log('[Subscription] Store sync skipped (likely offline or network error)');
    }
  }, [handlePurchaseSuccess]);

  // Initial load: Priority 1 - Local Cache (Resilience)
  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedValue) {
          setSubscription(JSON.parse(storedValue));
        }
      } catch (error) {
        console.error('[Subscription] Cache read error:', error);
      } finally {
        // App is ready to show UI as soon as cache is loaded
        setIsLoading(false);
      }
    };
    loadSubscription();
  }, []);

  // Priority 2 - Store Integration (Transparency)
  useEffect(() => {
    let purchaseUpdateSub: { remove: () => void } | undefined;
    let purchaseErrorSub: { remove: () => void } | undefined;

    const initIAP = async () => {
      try {
        const connected = await IAP.initConnection();
        setIsIapInitialized(connected);
        
        if (connected) {
          purchaseUpdateSub = IAP.purchaseUpdatedListener(async (purchase) => {
            if (purchase.productId) {
              await handlePurchaseSuccess(purchase);
              await IAP.finishTransaction({ purchase });
            }
          });

          purchaseErrorSub = IAP.purchaseErrorListener((error) => {
            const code = (error as { code?: string }).code;
            if (code !== 'E_USER_CANCELLED') {
              console.warn('[Subscription] Listener error:', error);
            }
          });

          const fetchedProducts = await IAP.fetchProducts({ skus: ALL_SKUS });
          if (fetchedProducts) {
            setProducts(fetchedProducts as IAP.Product[]);
          }

          await syncSubscriptionStatus();
        }
      } catch (error) {
        // If connection fails (offline), we already have the local cache from above.
        console.log('[Subscription] Store connection failed (Offline mode)');
      }
    };

    initIAP();

    return () => {
      if (purchaseUpdateSub) purchaseUpdateSub.remove();
      if (purchaseErrorSub) purchaseErrorSub.remove();
      IAP.endConnection();
    };
  }, [handlePurchaseSuccess, syncSubscriptionStatus]);

  /**
   * Purchase Flow: Requires active connection.
   */
  const purchasePlan = useCallback(async (plan: PlanType) => {
    if (!isIapInitialized) {
      Alert.alert('Network Required', 'An active internet connection is required to complete purchases.');
      return;
    }

    let sku = '';
    if (plan === 'MONTHLY') sku = SKU_MONTHLY;
    else if (plan === 'YEARLY') sku = SKU_YEARLY;
    else if (plan === 'LIFETIME') sku = SKU_LIFETIME;

    try {
      await IAP.requestPurchase({
        request: {
          apple: { sku },
          google: { skus: [sku] }
        },
        type: sku === SKU_LIFETIME ? 'in-app' : 'subs'
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== 'E_USER_CANCELLED') {
        Alert.alert('Purchase Error', 'We could not process your request. Check your store account.');
      }
    }
  }, [isIapInitialized]);

  /**
   * Restoration Flow: Hand-tailored to handle multiple platforms reliably.
   */
  const restorePurchase = useCallback(async () => {
    if (!isIapInitialized) {
      Alert.alert('Network Required', 'Please connect to the internet to restore your purchases.');
      return;
    }
    
    try {
      const result = await IAP.restorePurchases();
      // Use unknown intermediate to satisfy strict TS check for void overlap
      const castedPurchases = (result as unknown as IAP.Purchase[]) || [];
      
      if (castedPurchases.length > 0) {
        // Sort by most recent to ensure we get the latest valid sub
        const sorted = [...castedPurchases].sort((a, b) => b.transactionDate - a.transactionDate);
        const latestPurchase = sorted[0];
        
        await handlePurchaseSuccess(latestPurchase);
        await IAP.finishTransaction({ purchase: latestPurchase });
        
        Alert.alert('Access Restored', 'Your Pro membership has been successfully reconciled.');
      } else {
        Alert.alert('No Access Found', 'We couldn\'t find any active Pro purchases for this account.');
      }
    } catch (error) {
      console.error('[Subscription] Restoration failed:', error);
      Alert.alert('Error', 'Restoration timed out or failed. Please try again later.');
    }
  }, [isIapInitialized, handlePurchaseSuccess]);

  const resetSubscription = useCallback(async () => {
    await saveSubscription(INITIAL_STATE);
  }, [saveSubscription]);

  /**
   * The single source of truth for the app's premium status.
   * Checks both the base flag and the expiration date for local validity.
   */
  const isPremiumActive = useMemo(() => !!(
    subscription.isPremium && 
    (!subscription.expiresAt || new Date(subscription.expiresAt) > new Date())
  ), [subscription]);

  return (
    <SubscriptionContext.Provider value={{ 
      subscription, 
      products,
      isPremium: isPremiumActive, 
      isLoading, 
      purchasePlan, 
      restorePurchase,
      resetSubscription 
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
