import { useState, useEffect } from 'react';
import { connect } from '@stacks/connect';

export function StacksWalletConnect() {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    // Check if user was previously connected
    const storedAddress = localStorage.getItem('stacksAddress');
    if (storedAddress) {
      setAddress(storedAddress);
    }
  }, []);

  const handleConnect = async () => {
    try {
      // New API v8: connect() returns addresses
      const response = await connect({
        appDetails: {
          name: 'Stacks Portal',
          icon: window.location.origin + '/vite.svg',
        },
      });
      
      if (response && response.addresses && response.addresses.length > 0) {
        // Find Stacks address by symbol
        const mainnetAddress = response.addresses.find((addr: any) => addr.symbol === 'STX')?.address;
        
        if (mainnetAddress) {
          setAddress(mainnetAddress);
          localStorage.setItem('stacksAddress', mainnetAddress);
          // Notify other components
          window.dispatchEvent(new Event('stacksWalletChanged'));
        }
      }
    } catch(error) {
      console.error('Connect error:', error);
    }
  };

  const handleDisconnect = () => {
    setAddress(null);
    localStorage.removeItem('stacksAddress');
    // Notify other components
    window.dispatchEvent(new Event('stacksWalletChanged'));
  };

  if (address) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 hidden sm:inline">
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
        </span>
        <button
          onClick={handleDisconnect}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition"
        >
          <span className="hidden sm:inline">Disconnect</span>
          <span className="sm:hidden">Discon.</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition"
    >
      Connect Wallet
    </button>
  );
}
