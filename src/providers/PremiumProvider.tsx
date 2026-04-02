import AsyncStorage from '@react-native-async-storage/async-storage';
import * as IAP from 'expo-iap';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AlertButton, AlertModal } from '../components/ui/AlertModal';
import { ALL_SKUS, SKU_LIFETIME } from '../constants/iap';
import { IAPProduct, IAPService } from '../services/iap.service';

/**
 * Internal state representation of the user's premium status.
 */
export interface PremiumState {
  isPremium: boolean;
}

/**
 * Context type defining the public API for the Premium system.
 */
type PremiumContextType = {
  isPremium: boolean;
  products: IAPProduct[];
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
  purchasePremium: () => Promise<void>;
  restorePurchase: () => Promise<void>;
  resetPremium: () => Promise<void>;
  showAlert: (config: { title: string; message?: string; type?: 'info' | 'success' | 'error' | 'warning'; buttons?: AlertButton[] }) => void;
};

export const PremiumContext = createContext<PremiumContextType | null>(null);

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within PremiumProvider');
  return ctx;
}

const STORAGE_KEY = '@luno_premium_v6';

const INITIAL_STATE: PremiumState = {
  isPremium: false,
};

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [premiumState, setPremiumState] = useState<PremiumState>(INITIAL_STATE);
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

  const savePremiumState = useCallback(async (newState: PremiumState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setPremiumState(newState);
    } catch (error) {
      console.error('[Premium] Failed to persist state:', error);
    }
  }, []);

  const handlePurchaseSuccess = useCallback(async (purchase: IAP.Purchase) => {
    if (purchase.productId === SKU_LIFETIME) {
      await savePremiumState({ isPremium: true });
    }
  }, [savePremiumState]);

  const syncPremiumStatus = useCallback(async () => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    try {
      const casted = await IAPService.getActivePurchases();
      const hasLifetime = casted.some(p => p.productId === SKU_LIFETIME);
      
      if (hasLifetime) {
        await savePremiumState({ isPremium: true });
        return;
      }

      // If we are currently premium but the store has no record, revoke.
      // NOTE: For one-time purchases, this usually only happens on refunds.
      setPremiumState(prev => {
        if (!prev.isPremium) return prev;
        const expiredState = { ...INITIAL_STATE };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expiredState)).catch(() => { });

        showAlert({
          title: 'Access Removed',
          message: 'Your Pro access has been revoked or was refunded. You can repurchase at any time.',
          type: 'warning',
        });
        return expiredState;
      });
    } catch (err) {
      console.log('[Premium] Store sync skipped:', err);
    } finally {
      isSyncing.current = false;
    }
  }, [savePremiumState, showAlert]);

  const syncRef = useRef(syncPremiumStatus);
  const purchaseRef = useRef(handlePurchaseSuccess);

  useEffect(() => {
    syncRef.current = syncPremiumStatus;
    purchaseRef.current = handlePurchaseSuccess;
  }, [syncPremiumStatus, handlePurchaseSuccess]);

  useEffect(() => {
    const loadState = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedValue) setPremiumState(JSON.parse(storedValue));
      } catch {
      } finally {
        setIsLoading(false);
      }
    };
    loadState();
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
              await purchaseRef.current(purchase);
              await IAP.finishTransaction({ purchase });
            }
          });

          purchaseErrorSub = IAP.purchaseErrorListener((error) => {
            const code = (error as { code?: string }).code;
            if (errorMsg(code) !== 'CANCELED') {
              setError(`IAP Error: ${code || 'Unknown error'}`);
            }
          });

          const fetched = await IAPService.getProducts(ALL_SKUS);
          setProducts(fetched);
          setHasFetched(true);

          await syncRef.current();
        } else {
          setError('Failed to connect to App Store / Google Play.');
        }
      } catch (err) {
        console.error('[Premium] IAP Initialization flow failed:', err);
        setError('Billing services currently unavailable.');
      }
    };

    initIAP();

    return () => {
      if (purchaseUpdateSub) purchaseUpdateSub.remove();
      if (purchaseErrorSub) purchaseErrorSub.remove();
    };
  }, []);

  const errorMsg = (code?: string) => {
    if (code === 'E_USER_CANCELLED') return 'CANCELED';
    return code;
  };

  useEffect(() => {
    if (!isIapInitialized) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && !isSyncing.current) {
        syncPremiumStatus().catch(() => { });
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [isIapInitialized, syncPremiumStatus]);

  const purchasePremium = useCallback(async () => {
    if (!isIapInitialized) {
      showAlert({
        title: 'Network Required',
        message: 'An active internet connection is required to complete purchases.',
        type: 'error',
      });
      return;
    }

    try {
      await IAP.requestPurchase({
        request: {
          apple: { sku: SKU_LIFETIME },
          google: { skus: [SKU_LIFETIME] }
        },
        type: 'in-app'
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (errorMsg(code) !== 'CANCELED') {
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
      const hasLifetime = castedPurchases.some(p => p.productId === SKU_LIFETIME);

      if (hasLifetime) {
        await savePremiumState({ isPremium: true });
        showAlert({
          title: 'Access Restored',
          message: 'Your permanent Luno Pro access has been restored.',
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
      console.error('[Premium] Restoration failed:', error);
      showAlert({
        title: 'Restoration Failed',
        message: 'Restoration timed out or failed. Please try again later.',
        type: 'error',
      });
    }
  }, [isIapInitialized, savePremiumState, showAlert]);

  const resetPremium = useCallback(async () => {
    await savePremiumState(INITIAL_STATE);
  }, [savePremiumState]);

  return (
    <PremiumContext.Provider value={{
      isPremium: premiumState.isPremium,
      products,
      isLoading: isLoading || (!hasFetched && !error),
      error,
      hasFetched,
      purchasePremium,
      restorePurchase,
      resetPremium,
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
    </PremiumContext.Provider>
  );
}
