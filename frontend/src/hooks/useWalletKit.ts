import { useState, useEffect } from 'react';
import { initWalletKit, getWalletKit } from '../utils/walletkit';
import { WalletKit } from '@reown/walletkit';

export function useWalletKit() {
  const [walletKit, setWalletKit] = useState<WalletKit | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const wk = await initWalletKit();
        setWalletKit(wk);
        setIsInitialized(true);

        // Get active sessions
        const activeSessions = wk.getActiveSessions();
        setSessions(Object.values(activeSessions));

        // Listen for session proposals
        wk.on('session_proposal', async (proposal) => {
          console.log('Session proposal received:', proposal);
          // Handle session proposal
        });

        // Listen for session requests
        wk.on('session_request', async (event) => {
          console.log('Session request received:', event);
          // Handle session request
        });

        // Listen for session delete
        wk.on('session_delete', () => {
          const activeSessions = wk.getActiveSessions();
          setSessions(Object.values(activeSessions));
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
  };
}

