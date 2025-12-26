import { useConnect } from '@stacks/connect-react';
import { StacksMainnet } from '@stacks/network';
import { useState } from 'react';

export function WalletConnect() {
  const { doOpenAuth, isAuthenticated, userData, doSignOut } = useConnect();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await doOpenAuth({
        appDetails: {
          name: 'Stacks Portal',
          icon: window.location.origin + '/vite.svg',
        },
        redirectTo: '/',
        onFinish: () => {
          setIsConnecting(false);
        },
        onCancel: () => {
          setIsConnecting(false);
        },
      });
    } catch (error) {
      console.error('Connection error:', error);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    doSignOut();
  };

  if (isAuthenticated && userData) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">
          {userData.profile.stxAddress.mainnet.slice(0, 6)}...
          {userData.profile.stxAddress.mainnet.slice(-4)}
        </span>
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}

