import { useEffect } from 'react';
import { useSubscription } from './useSubscription';
import { sessionStore } from '@/store/session';
import { useSnapshot } from 'valtio';

/**
 * Hook to initialize subscription status
 * This hook is used to fetch subscription status from the server
 * when the app starts or when the user logs in
 */
export function useInitSubscription() {
  const { fetchSubscriptionFromServer, checkSubscriptionStatus } = useSubscription();
  const sessionSnap = useSnapshot(sessionStore);
  
  useEffect(() => {
    console.log('useInitSubscription');
    // Only fetch subscription status if user is logged in
    if (sessionSnap.token) {
      const initSubscription = async () => {
        // First try to get subscription status from server
        const serverStatus = await fetchSubscriptionFromServer();
        
        // If server status is not active, check local status
        if (!serverStatus) {
          await checkSubscriptionStatus();
        }
      };
      
      initSubscription();
    }
  }, [sessionSnap.token, fetchSubscriptionFromServer, checkSubscriptionStatus]);
  
  return null;
} 