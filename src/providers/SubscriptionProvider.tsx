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
 * This object is persisted locally to ensure offline access.
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
 * Handles store connections, product fetching, purchase flows, and persistent state sync.
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

    // Determine plan type and expiration based on SKU
    if (sku === SKU_MONTHLY) {
      planType = 'MONTHLY';
      const exp = new Date(purchase.transactionDate || now.getTime());
      exp.setMonth(exp.getMonth() + 1);
      exp.setDate(exp.getDate() + 3); // 3-day grace period
      expiresAt = exp.toISOString();
    } else if (sku === SKU_YEARLY) {
      planType = 'YEARLY';
      const exp = new Date(purchase.transactionDate || now.getTime());
      exp.setFullYear(exp.getFullYear() + 1);
      exp.setDate(exp.getDate() + 3); // 3-day grace period
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
   * Automatically called on app launch to ensure local state hasn't drifted from the store.
   */
  const syncSubscriptionStatus = useCallback(async () => {
    try {
      const available = await IAP.getAvailablePurchases();
      const casted = (available as IAP.Purchase[]) || [];
      
      if (casted.length > 0) {
        // Find the highest prioritized active purchase (Lifetime > Yearly > Monthly)
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

      // Fallback: If store reports no active items, verify if existing local state has expired
      setSubscription(prev => {
        if (prev.isPremium && prev.planType !== 'LIFETIME') {
          const isActuallyExpired = prev.expiresAt && new Date(prev.expiresAt) < new Date();
          if (isActuallyExpired) {
            const expiredState = { ...INITIAL_STATE };
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expiredState)).catch(err => 
              console.error('[Subscription] Sync cleanup failed:', err)
            );
            return expiredState;
          }
        }
        return prev;
      });
    } catch (error) {
      console.error('[Subscription] Store sync failed:', error);
    }
  }, [handlePurchaseSuccess]);

  // Initial load of local subscription state
  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedValue) {
          setSubscription(JSON.parse(storedValue));
        }
      } catch (error) {
        console.error('[Subscription] Local load failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSubscription();
  }, []);

  // Initialize IAP listeners and connect to store
  useEffect(() => {
    let purchaseUpdateSub: { remove: () => void } | undefined;
    let purchaseErrorSub: { remove: () => void } | undefined;

    const initIAP = async () => {
      try {
        const connected = await IAP.initConnection();
        setIsIapInitialized(connected);
        
        if (connected) {
          // Listen for incoming successful transactions
          purchaseUpdateSub = IAP.purchaseUpdatedListener(async (purchase) => {
            if (purchase.productId) {
              await handlePurchaseSuccess(purchase);
              await IAP.finishTransaction({ purchase });
            }
          });

          // Handle store-level errors
          purchaseErrorSub = IAP.purchaseErrorListener((error) => {
            const code = (error as { code?: string }).code;
            if (code !== 'E_USER_CANCELLED') {
              Alert.alert('Store Connection', 'A transaction error occurred. Please try again.');
            }
          });

          // Fetch latest product metadata
          const fetchedProducts = await IAP.fetchProducts({ skus: ALL_SKUS });
          if (fetchedProducts) {
            setProducts(fetchedProducts as IAP.Product[]);
          }

          // Reconcile status with store immediately after connection
          await syncSubscriptionStatus();
        }
      } catch (error) {
        console.error('[Subscription] Initialization failed:', error);
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
   * Requests a purchase for the specified plan from the respective platform store.
   */
  const purchasePlan = useCallback(async (plan: PlanType) => {
    if (!isIapInitialized) {
      Alert.alert('Store Unavailable', 'Please check your internet connection and try again.');
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
      console.error('[Subscription] Purchase flow aborted:', error);
      const code = (error as { code?: string }).code;
      if (code !== 'E_USER_CANCELLED') {
        Alert.alert('Purchase Error', 'Could not complete the request at this time.');
      }
    }
  }, [isIapInitialized]);

  /**
   * Restores all valid historical purchases onto the current device.
   */
  const restorePurchase = useCallback(async () => {
    if (!isIapInitialized) return;
    
    try {
      const result = await IAP.restorePurchases();
      const castedPurchases = (result as unknown as IAP.Purchase[]) || [];
      
      if (castedPurchases.length > 0) {
        const sorted = [...castedPurchases].sort((a, b) => b.transactionDate - a.transactionDate);
        const latestPurchase = sorted[0];
        await handlePurchaseSuccess(latestPurchase);
        
        // Finalize transaction to clear from store queue
        await IAP.finishTransaction({ purchase: latestPurchase });
        
        Alert.alert('Restoration Complete', 'Your Pro access has been successfully restored.');
      } else {
        Alert.alert('Store Information', 'No eligible previous purchases were found for this account.');
      }
    } catch (error) {
      console.error('[Subscription] Restore process failed:', error);
      Alert.alert('Restoration Error', 'We encountered a problem while restoring your access.');
    }
  }, [isIapInitialized, handlePurchaseSuccess]);

  /**
   * Local reset for administrative/debug purposes.
   */
  const resetSubscription = useCallback(async () => {
    await saveSubscription(INITIAL_STATE);
  }, [saveSubscription]);

  /**
   * High-performance derived state for premium status gating.
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
