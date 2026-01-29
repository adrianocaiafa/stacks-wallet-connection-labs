import { useState, useEffect } from 'react';

export function useStacksWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check localStorage on mount
    const checkConnection = () => {
      const storedAddress = localStorage.getItem('stacksAddress');
      setAddress(storedAddress);
      setIsConnected(!!storedAddress);
    };

    checkConnection();

    // Listen for storage changes (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'stacksAddress') {
        setAddress(e.newValue);
        setIsConnected(!!e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event for same-tab updates
    const handleCustomEvent = () => {
      checkConnection();
    };

    window.addEventListener('stacksWalletChanged', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('stacksWalletChanged', handleCustomEvent);
    };
  }, []);

  return { address, isConnected };
}
