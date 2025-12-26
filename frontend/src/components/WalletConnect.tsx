import { useState, useEffect } from 'react';
import { useWalletKit } from '../hooks/useWalletKit';
import { getSdkError } from '@walletconnect/utils';
import { buildApprovedNamespaces } from '@walletconnect/utils';

export function WalletConnect() {
  const { walletKit, isInitialized, sessions } = useWalletKit();
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);

  useEffect(() => {
    if (sessions.length > 0) {
      setCurrentSession(sessions[0]);
    } else {
      setCurrentSession(null);
    }
  }, [sessions]);

  useEffect(() => {
    if (!walletKit || !isInitialized) return;

    // Handle session proposals
    const handleSessionProposal = async (proposal: any) => {
      try {
        // For Stacks, we need to build namespaces
        // Note: Stacks support in WalletConnect may require specific configuration
        const approvedNamespaces = buildApprovedNamespaces({
          proposal: proposal.params,
          supportedNamespaces: {
            // Stacks namespace (if supported)
            // For now, we'll use a basic structure
            stacks: {
              chains: ['stacks:1'], // Mainnet
              methods: ['stx_transferStx', 'stx_callContract'],
              events: ['chainChanged', 'accountsChanged'],
              accounts: [], // Will be populated after connection
            },
          },
        });

        const session = await walletKit.approveSession({
          id: proposal.id,
          namespaces: approvedNamespaces,
        });

        setCurrentSession(session);
        setIsConnecting(false);
      } catch (error) {
        console.error('Session approval error:', error);
        await walletKit.rejectSession({
          id: proposal.id,
          reason: getSdkError('USER_REJECTED'),
        });
        setIsConnecting(false);
      }
    };

    walletKit.on('session_proposal', handleSessionProposal);

    return () => {
      walletKit.off('session_proposal', handleSessionProposal);
    };
  }, [walletKit, isInitialized]);

  const handleConnect = async () => {
    if (!walletKit || !isInitialized) {
      alert('WalletKit não está inicializado. Verifique a configuração.');
      return;
    }

    setIsConnecting(true);
    
    // For web wallets, we can pair with a URI from query params
    const urlParams = new URLSearchParams(window.location.search);
    const uri = urlParams.get('uri');
    
    if (uri) {
      try {
        await walletKit.pair({ uri });
      } catch (error) {
        console.error('Pairing error:', error);
        setIsConnecting(false);
      }
    } else {
      // Show QR code or input field for manual URI entry
      const wcUri = prompt('Cole o WalletConnect URI ou escaneie o QR code:');
      if (wcUri) {
        try {
          await walletKit.pair({ uri: wcUri });
        } catch (error) {
          console.error('Pairing error:', error);
          setIsConnecting(false);
        }
      } else {
        setIsConnecting(false);
      }
    }
  };

  const handleDisconnect = async () => {
    if (!walletKit || !currentSession) return;

    try {
      await walletKit.disconnectSession({
        topic: currentSession.topic,
        reason: getSdkError('USER_DISCONNECTED'),
      });
      setCurrentSession(null);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  if (currentSession) {
    const account = currentSession.namespaces?.stacks?.accounts?.[0] || 
                   currentSession.namespaces?.eip155?.accounts?.[0] || 
                   'Connected';
    const address = account.split(':').pop() || account;
    
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
      disabled={isConnecting || !isInitialized}
      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
    >
      {!isInitialized ? 'Loading...' : isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}

