import AsyncStorage from '@react-native-async-storage/async-storage';
import * as IAP from 'expo-iap';
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { ALL_SKUS, SKU_LIFETIME, SKU_MONTHLY, SKU_YEARLY } from '../constants/iap';
import { IAPProduct, IAPService } from '../services/iap.service';
import { AlertModal, AlertButton } from '../components/ui/AlertModal';

/**
 * Supported subscription plans in the Luno ecosystem.
 */
export type PlanType = 'MONTHLY' | 'YEARLY' | 'LIFETIME';

/**
 * Internal state representation of the user's subscription status.
 */
export interface SubscriptionState {
  isPremium: boolean;
  planType: PlanType | null;
}

/**
 * Context type defining the public API for the Subscription system.
 */
type SubscriptionContextType = {
  subscription: SubscriptionState;
  products: IAPProduct[];
  isPremium: boolean;
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
  purchasePlan: (plan: PlanType) => Promise<void>;
  restorePurchase: () => Promise<void>;
  manageSubscription: () => Promise<void>;
  resetSubscription: () => Promise<void>;
  showAlert: (config: { title: string; message?: string; type?: 'info' | 'success' | 'error' | 'warning'; buttons?: AlertButton[] }) => void;
};

export const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}

const STORAGE_KEY = '@luno_subscription_v4';

const INITIAL_STATE: SubscriptionState = {
  isPremium: false,
  planType: null,
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionState>(INITIAL_STATE);
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isIapInitialized, setIsIapInitialized] = useState(false);
  const isSyncing = useRef(false);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type: 'info' | 'success' | 'error' | 'warning';
    buttons: AlertButton[];
  }>({
    visible: false,
    title: '',
    type: 'info',
    buttons: [{ text: 'OK' }],
  });

  const showAlert = useCallback((config: { title: string; message?: string; type?: 'info' | 'success' | 'error' | 'warning'; buttons?: AlertButton[] }) => {
    setAlertConfig({
      visible: true,
      title: config.title,
      message: config.message,
      type: config.type || 'info',
      buttons: config.buttons || [{ text: 'OK' }],
    });
  }, []);

  const saveSubscription = useCallback(async (newState: SubscriptionState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setSubscription(newState);
    } catch (error) {
      console.error('[Subscription] Failed to persist state:', error);
    }
  }, []);

  const handlePurchaseSuccess = useCallback(async (purchase: IAP.Purchase) => {
    const sku = purchase.productId;
    let planType: PlanType | null = null;

    if (sku === SKU_MONTHLY) planType = 'MONTHLY';
    else if (sku === SKU_YEARLY) planType = 'YEARLY';
    else if (sku === SKU_LIFETIME) planType = 'LIFETIME';

    if (planType) {
      const newState: SubscriptionState = {
        isPremium: true,
        planType,
      };
      await saveSubscription(newState);
    }
  }, [saveSubscription]);

  const syncSubscriptionStatus = useCallback(async () => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    try {
      const casted = await IAPService.getActivePurchases();
      
      if (casted.length > 0) {
        const sortedByTier = [...casted].sort((a, b) => {
          const tierVal = (id: string) => {
            if (id === SKU_LIFETIME) return 3;
            if (id === SKU_YEARLY) return 2;
            if (id === SKU_MONTHLY) return 1;
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

      setSubscription(prev => {
        if (!prev.isPremium) return prev;
        const expiredState = { ...INITIAL_STATE };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expiredState)).catch(() => {});
        
        showAlert({
          title: 'Access Removed',
          message: 'Your Pro access has ended or was refunded. You can re-purchase at any time.',
          type: 'warning',
        });
        return expiredState;
      });
    } catch (err) {
      console.log('[Subscription] Store sync skipped:', err);
    } finally {
      isSyncing.current = false;
    }
  }, [handlePurchaseSuccess, showAlert]);

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedValue) setSubscription(JSON.parse(storedValue));
      } catch {
      } finally {
        setIsLoading(false);
      }
    };
    loadSubscription();
  }, []);

  useEffect(() => {
    let purchaseUpdateSub: { remove: () => void } | undefined;
    let purchaseErrorSub: { remove: () => void } | undefined;

    const initIAP = async () => {
      try {
        const connected = await IAPService.init();
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
              setError(`IAP Error: ${code || 'Unknown error'}`);
            }
          });

          const fetched = await IAPService.getProducts(ALL_SKUS);
          setProducts(fetched);
          setHasFetched(true);

          if (fetched.length === 0 && !__DEV__) {
            setError('Could not connect to store or no products found.');
          }

          await syncSubscriptionStatus();
        } else {
          setError('Failed to connect to App Store / Google Play.');
        }
      } catch (err) {
        console.error('[Subscription] IAP Initialization flow failed:', err);
        setError('Billing services currently unavailable.');
      }
    };

    initIAP();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isIapInitialized && !isSyncing.current) {
        syncSubscriptionStatus().catch(() => {});
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (purchaseUpdateSub) purchaseUpdateSub.remove();
      if (purchaseErrorSub) purchaseErrorSub.remove();
      sub.remove();
      IAPService.shutdown();
    };
  }, [handlePurchaseSuccess, syncSubscriptionStatus, isIapInitialized]);

  const purchasePlan = useCallback(async (plan: PlanType) => {
    if (!isIapInitialized) {
      showAlert({
        title: 'Network Required',
        message: 'An active internet connection is required to complete purchases.',
        type: 'error',
      });
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
        showAlert({
          title: 'Purchase Error',
          message: 'We could not process your request. Check your store account.',
          type: 'error',
        });
      }
    }
  }, [isIapInitialized, showAlert]);

  const restorePurchase = useCallback(async () => {
    if (!isIapInitialized) {
      showAlert({
        title: 'Network Required',
        message: 'Please connect to the internet to restore your purchases.',
        type: 'error',
      });
      return;
    }
    
    try {
      const castedPurchases = await IAPService.getActivePurchases();
      
      if (castedPurchases.length > 0) {
        const sorted = [...castedPurchases].sort((a, b) => b.transactionDate - a.transactionDate);
        const latestPurchase = sorted[0];
        
        await handlePurchaseSuccess(latestPurchase);
        await IAP.finishTransaction({ purchase: latestPurchase });
        
        showAlert({
          title: 'Access Restored',
          message: 'Your Pro membership has been successfully reconciled.',
          type: 'success',
        });
      } else {
        showAlert({
          title: 'No Access Found',
          message: "We couldn't find any active Pro purchases for this account.",
          type: 'info',
        });
      }
    } catch (error) {
      console.error('[Subscription] Restoration failed:', error);
      showAlert({
        title: 'Restoration Failed',
        message: 'Restoration timed out or failed. Please try again later.',
        type: 'error',
      });
    }
  }, [isIapInitialized, handlePurchaseSuccess, showAlert]);

  const manageSubscription = useCallback(async () => {
    await IAPService.manage();
  }, []);

  const resetSubscription = useCallback(async () => {
    await saveSubscription(INITIAL_STATE);
  }, [saveSubscription]);

  const isPremiumActive = useMemo(() => !!subscription.isPremium, [subscription]);

  return (
    <SubscriptionContext.Provider value={{ 
      subscription, 
      products,
      isPremium: isPremiumActive, 
      isLoading: isLoading || (!hasFetched && !error), 
      error,
      hasFetched,
      purchasePlan, 
      restorePurchase,
      manageSubscription,
      resetSubscription,
      showAlert
    }}>
      {children}
      
      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </SubscriptionContext.Provider>
  );
}
