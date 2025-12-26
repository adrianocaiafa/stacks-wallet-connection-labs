import { useState, useEffect } from 'react';
import { initWalletKit } from '../utils/walletkit';
import { WalletKit } from '@reown/walletkit';

export function useWalletKit() {
  const [walletKit, setWalletKit] = useState<WalletKit | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const wk = await initWalletKit();
        setWalletKit(wk);
        setIsInitialized(true);

        // Get active sessions
        const updateSessions = () => {
          const activeSessions = wk.getActiveSessions();
          const sessionArray = Object.values(activeSessions);
          setSessions(sessionArray);
          
          // Extract address from first session if available
          if (sessionArray.length > 0) {
            const session = sessionArray[0];
            // Try to get address from stacks namespace
            const stacksAccounts = session.namespaces?.stacks?.accounts || [];
            if (stacksAccounts.length > 0) {
              // Format: stacks:1:ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
              const account = stacksAccounts[0];
              const addressPart = account.split(':').pop();
              setAddress(addressPart || null);
            } else {
              setAddress(null);
            }
          } else {
            setAddress(null);
          }
        };

        updateSessions();

        // Listen for session proposals
        wk.on('session_proposal', async (proposal) => {
          console.log('Session proposal received:', proposal);
        });

        // Listen for session requests
        wk.on('session_request', async (event) => {
          console.log('Session request received:', event);
        });

        // Listen for session delete
        wk.on('session_delete', () => {
          updateSessions();
        });

        // Listen for session update
        wk.on('session_update', () => {
          updateSessions();
        });
      } catch (error) {
        console.error('Failed to initialize WalletKit:', error);
      }
    };

    initialize();
  }, []);

  return {
    walletKit,
    isInitialized,
    sessions,
    address,
  };
}

