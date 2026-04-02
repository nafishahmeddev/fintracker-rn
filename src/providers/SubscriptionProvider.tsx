import AsyncStorage from '@react-native-async-storage/async-storage';
import * as IAP from 'expo-iap';
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { Alert } from 'react-native';
import { ALL_SKUS, SKU_LIFETIME, SKU_MONTHLY, SKU_YEARLY } from '../constants/iap';

export type PlanType = 'MONTHLY' | 'YEARLY' | 'LIFETIME';

export interface SubscriptionState {
  isPremium: boolean;
  planType: PlanType | null;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  purchasedAt: string | null;
  expiresAt: string | null;
}

export type Product = IAP.Product;

type SubscriptionContextType = {
  subscription: SubscriptionState;
  products: Product[];
  isPremium: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number | null;
  isLoading: boolean;
  purchasePlan: (plan: PlanType) => Promise<void>;
  restorePurchase: () => Promise<void>;
  startTrial: () => Promise<void>;
  resetSubscription: () => Promise<void>;
};

export const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}

const STORAGE_KEY = '@luno_subscription_v4';
const TRIAL_DURATION_DAYS = 14;

const INITIAL_STATE: SubscriptionState = {
  isPremium: false,
  planType: null,
  trialStartedAt: null,
  trialEndsAt: null,
  purchasedAt: null,
  expiresAt: null,
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionState>(INITIAL_STATE);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIapInitialized, setIsIapInitialized] = useState(false);

  const saveSubscription = useCallback(async (newState: SubscriptionState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setSubscription(newState);
    } catch (e) {
      console.error('Failed to save subscription', e);
    }
  }, []);

  const handlePurchaseSuccess = useCallback(async (purchase: IAP.Purchase) => {
    const sku = purchase.productId;
    const now = new Date();
    let planType: PlanType | null = null;
    let expiresAt: string | null = null;

    if (sku === SKU_MONTHLY) {
      planType = 'MONTHLY';
      const exp = new Date();
      exp.setMonth(now.getMonth() + 1);
      expiresAt = exp.toISOString();
    } else if (sku === SKU_YEARLY) {
      planType = 'YEARLY';
      const exp = new Date();
      exp.setFullYear(now.getFullYear() + 1);
      expiresAt = exp.toISOString();
    } else if (sku === SKU_LIFETIME) {
      planType = 'LIFETIME';
      expiresAt = null;
    }

    if (planType) {
      const newState: SubscriptionState = {
        isPremium: true,
        planType,
        purchasedAt: now.toISOString(),
        expiresAt,
        trialStartedAt: null, // Reset trial if they buy
        trialEndsAt: null,
      };
      await saveSubscription(newState);
    }
  }, [saveSubscription]);

  // Load local state first
  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedValue) {
          setSubscription(JSON.parse(storedValue));
        }
      } catch (e) {
        console.error('Failed to load local subscription status', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSubscription();
  }, []);

  // Initialize IAP and fetch products
  useEffect(() => {
    let purchaseUpdateSub: { remove: () => void } | undefined;
    let purchaseErrorSub: { remove: () => void } | undefined;

    const initIAP = async () => {
      try {
        const result = await IAP.initConnection();
        setIsIapInitialized(result);
        
        if (result) {
          purchaseUpdateSub = IAP.purchaseUpdatedListener(async (purchase) => {
            if (purchase.productId) {
              await handlePurchaseSuccess(purchase);
              await IAP.finishTransaction({ purchase });
            }
          });

          purchaseErrorSub = IAP.purchaseErrorListener((error) => {
            if (String(error.code) !== 'E_USER_CANCELLED') {
              Alert.alert('Store Error', 'Could not complete the transaction.');
            }
          });

          const fetchedProducts = await IAP.fetchProducts({ skus: ALL_SKUS });
          setProducts((fetchedProducts as any) || []);
        }
      } catch (e) {
        console.error('IAP Initialization Logic Error:', e);
      }
    };

    initIAP();

    return () => {
      if (purchaseUpdateSub) purchaseUpdateSub.remove();
      if (purchaseErrorSub) purchaseErrorSub.remove();
      IAP.endConnection();
    };
  }, [handlePurchaseSuccess]);

  const startTrial = useCallback(async () => {
    if (subscription.trialStartedAt) return;

    const now = new Date();
    const ends = new Date();
    ends.setDate(now.getDate() + TRIAL_DURATION_DAYS);

    const newState: SubscriptionState = {
      ...subscription,
      trialStartedAt: now.toISOString(),
      trialEndsAt: ends.toISOString(),
    };
    await saveSubscription(newState);
  }, [subscription, saveSubscription]);

  const purchasePlan = useCallback(async (plan: PlanType) => {
    if (!isIapInitialized) {
      Alert.alert('Store Unavailable', 'Payment connection not ready.');
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
    } catch (e: any) {
      console.error('Purchase Plan error:', e);
      if (e.code !== 'E_USER_CANCELLED') {
        Alert.alert('Store Error', 'Could not initiate purchase.');
      }
    }
  }, [isIapInitialized]);

  const restorePurchase = useCallback(async () => {
    if (!isIapInitialized) return;
    
    try {
      const result = await IAP.restorePurchases();
      const castedPurchases = result as unknown as IAP.Purchase[];
      if (Array.isArray(castedPurchases) && castedPurchases.length > 0) {
        const sorted = [...castedPurchases].sort((a, b) => b.transactionDate - a.transactionDate);
        const latestPurchase = sorted[0];
        await handlePurchaseSuccess(latestPurchase);
        Alert.alert('Success', 'Access restored successfully.');
      } else {
        Alert.alert('Information', 'No previous purchases found.');
      }
    } catch (e) {
      console.error('Restore Logic Error:', e);
      Alert.alert('Error', 'Failed to restore purchases.');
    }
  }, [isIapInitialized, handlePurchaseSuccess]);

  const resetSubscription = useCallback(async () => {
    await saveSubscription(INITIAL_STATE);
  }, [saveSubscription]);

  // Derivative state
  const isTrialActive = useMemo(() => !!(
    subscription.trialEndsAt && 
    new Date(subscription.trialEndsAt) > new Date() && 
    !subscription.isPremium
  ), [subscription]);

  const trialDaysRemaining = useMemo(() => subscription.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null, [subscription]);

  const isPremiumActive = useMemo(() => !!(
    subscription.isPremium && 
    (!subscription.expiresAt || new Date(subscription.expiresAt) > new Date())
  ), [subscription]);

  const isAccessGranted = isPremiumActive || isTrialActive;

  return (
    <SubscriptionContext.Provider value={{ 
      subscription, 
      products,
      isPremium: isAccessGranted, 
      isTrialActive, 
      trialDaysRemaining,
      isLoading, 
      purchasePlan, 
      restorePurchase,
      startTrial,
      resetSubscription 
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
