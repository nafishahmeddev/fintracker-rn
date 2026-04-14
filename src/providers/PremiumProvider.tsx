import AsyncStorage from '@react-native-async-storage/async-storage';
import * as IAP from 'expo-iap';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AlertButton, AlertModal } from '../components/ui/AlertModal';
import { ALL_SKUS, SKU_LIFETIME } from '../constants/iap';
import { IAPProduct, IAPService } from '../services/iap.service';

/**
 * PremiumState: The persistent representation of user access.
 */
export interface PremiumState {
  isPremium: boolean;
}

export type DevOverride = 'FORCED_ON' | 'FORCED_OFF' | 'DEFAULT';

/**
 * PremiumContextType: Standard API exposed to consumers (Dashboard, Settings, etc.).
 */
export type PremiumContextType = {
  isPremium: boolean;
  products: IAPProduct[];
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
  purchasePremium: () => Promise<void>;
  restorePurchase: () => Promise<void>;
  resetPremium: () => Promise<void>;
  setDevOverride: (val: DevOverride) => Promise<void>;
  devOverride: DevOverride;
  showAlert: (config: { title: string; message?: string; type?: 'info' | 'success' | 'error' | 'warning'; buttons?: AlertButton[] }) => void;
};

export const PremiumContext = createContext<PremiumContextType | null>(null);

/**
 * usePremium: Access the Luno Pro ecosystem within any functional component.
 */
export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within PremiumProvider');
  return ctx;
}

const STORAGE_KEY = '@luno_premium_v7';
const DEV_OVERRIDE_KEY = '@luno_dev_force_pro';
const INITIAL_STATE: PremiumState = { isPremium: false };

/**
 * PremiumProvider: The single source of truth for application entitlements.
 * Handles storage persistence, native bridge synchronization, and purchase flows.
 */
export function PremiumProvider({ children }: { children: ReactNode }) {
  const [premiumState, setPremiumState] = useState<PremiumState>(INITIAL_STATE);
  const [devOverride, setDevOverrideState] = useState<DevOverride>('DEFAULT');
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isIapInitialized, setIsIapInitialized] = useState(false);
  const isSyncing = useRef(false);

  // Custom Alert Modal State
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

  /**
   * Helper to display the Editorial Brutalist alert modals.
   */
  const showAlert = useCallback((config: { title: string; message?: string; type?: 'info' | 'success' | 'error' | 'warning'; buttons?: AlertButton[] }) => {
    setAlertConfig({
      visible: true,
      title: config.title,
      message: config.message,
      type: config.type || 'info',
      buttons: config.buttons || [{ text: 'OK' }],
    });
  }, []);

  /**
   * Persists premium logic to local storage for offline resilience.
   */
  const savePremiumState = useCallback(async (newState: PremiumState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setPremiumState(newState);
    } catch (err) {
      console.error('[Premium] Persistence failure:', err);
    }
  }, []);

  const handlePurchaseSuccess = useCallback(async (purchase: IAP.Purchase) => {
    if (purchase.productId === SKU_LIFETIME) {
      await savePremiumState({ isPremium: true });
    }
  }, [savePremiumState]);

  /**
   * Synchronizes local state with verified native store entitlements.
   */
  const syncPremiumStatus = useCallback(async () => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    try {
      const active = await IAPService.getActivePurchases();
      const hasLifetime = active.some(p => p.productId === SKU_LIFETIME);
      
      if (hasLifetime) {
        if (!premiumState.isPremium) await savePremiumState({ isPremium: true });
        return;
      }

      // Reconciliation: If cached premium state is active but store has no record (e.g. refund/revocation)
      if (premiumState.isPremium) {
        await savePremiumState(INITIAL_STATE);
        showAlert({
          title: 'Access Revoked',
          message: 'Your Pro access has been revoked or was refunded. You can repurchase at any time.',
          type: 'warning',
        });
      }
    } catch {
      // Ignore background sync errors to prevent user interruption
    } finally {
      isSyncing.current = false;
    }
  }, [premiumState.isPremium, savePremiumState, showAlert]);

  // Keep internal refs updated for use in listener closures
  const syncRef = useRef(syncPremiumStatus);
  const purchaseRef = useRef(handlePurchaseSuccess);
  useEffect(() => {
    syncRef.current = syncPremiumStatus;
    purchaseRef.current = handlePurchaseSuccess;
  }, [syncPremiumStatus, handlePurchaseSuccess]);

  /**
   * Sequenced Initialization: 
   * 1. Load from storage (immediate, preventing UI flicker).
   * 2. Initialize native bridge.
   * 3. Sync entitlements + products.
   */
  useEffect(() => {
    let unmounted = false;
    let purchaseUpdateSub: { remove: () => void } | undefined;
    let purchaseErrorSub: { remove: () => void } | undefined;

    const initializeSystem = async () => {
      // 1. Storage check
      try {
        const [storedPremium, storedDev] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(DEV_OVERRIDE_KEY),
        ]);
        
        if (!unmounted) {
          if (storedPremium) setPremiumState(JSON.parse(storedPremium));
          if (storedDev) setDevOverrideState(storedDev as DevOverride);
        }
      } catch { }

      // 2. IAP Connection
      try {
        const connected = await IAPService.init();
        if (unmounted) return;
        setIsIapInitialized(connected);

        if (connected) {
          // Setup Listeners
          purchaseUpdateSub = IAP.purchaseUpdatedListener(async (purchase) => {
            if (purchase.productId) {
              await purchaseRef.current(purchase);
              await IAP.finishTransaction({ purchase });
            }
          });

          purchaseErrorSub = IAP.purchaseErrorListener((error) => {
            if (error.code !== IAP.ErrorCode.UserCancelled) {
              console.error('[Premium] Store error:', error);
            }
          });

          // Fetch Metadata
          const fetched = await IAPService.getProducts(ALL_SKUS);
          if (!unmounted) {
            setProducts(fetched);
            setHasFetched(true);
          }

          // Initial entitlement sync
          await syncRef.current();
        }
      } catch {
        if (!unmounted) setError('Billing interface currently unavailable.');
      } finally {
        if (!unmounted) setIsLoading(false);
      }
    };

    initializeSystem();

    return () => {
      unmounted = true;
      if (purchaseUpdateSub) purchaseUpdateSub.remove();
      if (purchaseErrorSub) purchaseErrorSub.remove();
    };
  }, []);

  /**
   * Foreground listener: Re-syncs entitlements whenever the user returns to the app.
   */
  useEffect(() => {
    if (!isIapInitialized) return;

    const listener = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') syncPremiumStatus().catch(() => { });
    });
    return () => listener.remove();
  }, [isIapInitialized, syncPremiumStatus]);

  const purchasePremium = useCallback(async () => {
    if (!isIapInitialized) {
      showAlert({ title: 'Network Required', message: 'Please check your connection to proceed.', type: 'error' });
      return;
    }

    try {
      await IAP.requestPurchase({
        request: { apple: { sku: SKU_LIFETIME }, google: { skus: [SKU_LIFETIME] } },
        type: 'in-app'
      });
    } catch (err: any) {
      if (err?.code !== IAP.ErrorCode.UserCancelled) {
        showAlert({ title: 'Purchase Error', message: 'We could not process your request at this time.', type: 'error' });
      }
    }
  }, [isIapInitialized, showAlert]);

  const restorePurchase = useCallback(async () => {
    if (!isIapInitialized) {
      showAlert({ title: 'Network Required', message: 'Please connect to the internet to restore access.', type: 'error' });
      return;
    }

    try {
      const active = await IAPService.getActivePurchases();
      const hasLifetime = active.some(p => p.productId === SKU_LIFETIME);

      if (hasLifetime) {
        await savePremiumState({ isPremium: true });
        showAlert({ title: 'Access Restored', message: 'Luno Pro has been successfully re-enabled.', type: 'success' });
      } else {
        showAlert({ title: 'No Purchase Found', message: "We couldn't find an active Pro license for this account.", type: 'info' });
      }
    } catch {
      showAlert({ title: 'Restoration Failed', message: 'Please try again in a few minutes.', type: 'error' });
    }
  }, [isIapInitialized, savePremiumState, showAlert]);

  const resetPremium = useCallback(async () => {
    await savePremiumState(INITIAL_STATE);
  }, [savePremiumState]);

  const setDevOverride = useCallback(async (val: DevOverride) => {
    try {
      await AsyncStorage.setItem(DEV_OVERRIDE_KEY, val);
      setDevOverrideState(val);
    } catch { }
  }, []);

  /**
   * isPremium: The final computed state.
   * Tripartite logic:
   * 1. FORCED_ON -> true
   * 2. FORCED_OFF -> false
   * 3. DEFAULT -> use store state
   */
  const isPremium = useMemo(() => {
    if (devOverride === 'FORCED_ON') return true;
    if (devOverride === 'FORCED_OFF') return false;
    return premiumState.isPremium;
  }, [premiumState.isPremium, devOverride]);

  /**
   * Context Memoization: Stops thousands of unnecessary re-renders in Dashboard/Settings
   * by ensuring the object reference only changes when actual data updates.
   */
  const contextValue = useMemo(() => ({
    isPremium,
    devOverride,
    products,
    isLoading,
    error,
    hasFetched,
    purchasePremium,
    restorePurchase,
    resetPremium,
    setDevOverride,
    showAlert
  }), [isPremium, devOverride, products, isLoading, error, hasFetched, purchasePremium, restorePurchase, resetPremium, setDevOverride, showAlert]);

  return (
    <PremiumContext.Provider value={contextValue}>
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
