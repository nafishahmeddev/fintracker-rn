import { useSubscription as useSubscriptionInternal } from '../providers/SubscriptionProvider';

/**
 * Hook to access the subscription status and methods.
 * Wraps the internal provider hook for cleaner imports throughout the app.
 */
export const useSubscription = useSubscriptionInternal;
