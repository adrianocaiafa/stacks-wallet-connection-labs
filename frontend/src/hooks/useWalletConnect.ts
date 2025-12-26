import { useState, useEffect } from 'react';
import { initSignClient, getSignClient } from '../utils/walletconnect';
import { SignClient } from '@walletconnect/sign-client';

export function useWalletConnect() {
  const [signClient, setSignClient] = useState<SignClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const client = await initSignClient();
        setSignClient(client);
        setIsInitialized(true);

        // Get active sessions
        const updateSessions = () => {
          const activeSessions = client.session.getAll();
          setSessions(activeSessions);
          
          // Extract address from first session if available
          if (activeSessions.length > 0) {
            const session = activeSessions[0];
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
        client.on('session_proposal', async (proposal) => {
          console.log('Session proposal received:', proposal);
        });

        // Listen for session requests
        client.on('session_request', async (event) => {
          console.log('Session request received:', event);
        });

        // Listen for session delete
        client.on('session_delete', () => {
          updateSessions();
        });

        // Listen for session update
        client.on('session_update', () => {
          updateSessions();
        });
      } catch (error) {
        console.error('Failed to initialize SignClient:', error);
      }
    };

    initialize();
  }, []);

  return {
    signClient,
    isInitialized,
    sessions,
    address,
  };
}

