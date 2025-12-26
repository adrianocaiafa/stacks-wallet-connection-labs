import { UserSession, redirectToSignIn } from '@stacks/connect';
import { useState, useEffect } from 'react';

interface WalletConnectProps {
  userSession: UserSession;
}

export function WalletConnect({ userSession }: WalletConnectProps) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      if (userSession.isUserSignedIn()) {
        setIsSignedIn(true);
        setUserData(userSession.loadUserData());
      } else {
        setIsSignedIn(false);
        setUserData(null);
      }
    };

    checkAuth();
    
    // Check auth state periodically (after redirect)
    const interval = setInterval(checkAuth, 1000);
    
    return () => clearInterval(interval);
  }, [userSession]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      redirectToSignIn({
        redirectTo: window.location.origin,
        appDetails: {
          name: 'Stacks Portal',
          icon: window.location.origin + '/vite.svg',
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

