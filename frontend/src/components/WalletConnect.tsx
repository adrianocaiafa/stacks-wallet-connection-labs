import { UserSession, showConnect } from '@stacks/connect';
import { useState, useEffect } from 'react';

interface WalletConnectProps {
  userSession: UserSession;
}

export function WalletConnect({ userSession }: WalletConnectProps) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setIsSignedIn(true);
      setUserData(userSession.loadUserData());
    }
  }, [userSession]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await showConnect({
        appDetails: {
          name: 'Stacks Portal',
          icon: window.location.origin + '/vite.svg',
        },
        redirectTo: '/',
        onFinish: () => {
          setIsSignedIn(true);
          setUserData(userSession.loadUserData());
          setIsConnecting(false);
        },
        onCancel: () => {
          setIsConnecting(false);
        },
        userSession,
      });
    } catch (error) {
      console.error('Connection error:', error);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    userSession.signUserOut();
    setIsSignedIn(false);
    setUserData(null);
  };

  if (isSignedIn && userData) {
    const address = userData.profile?.stxAddress?.mainnet || userData.profile?.stxAddress?.testnet || '';
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
      disabled={isConnecting}
      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}

