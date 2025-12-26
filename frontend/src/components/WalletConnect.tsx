import { useState, useEffect } from 'react';
import { useWalletKit } from '../hooks/useWalletKit';
import { getSdkError } from '@walletconnect/utils';
import { buildStacksNamespaces } from '../utils/walletkit';

export function WalletConnect() {
  const { walletKit, isInitialized, sessions, address } = useWalletKit();
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
        // For now, we'll use a placeholder address
        // In production, you would get this from the connected wallet
        const stacksAddresses = ['ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM']; // Placeholder
        
        const approvedNamespaces = buildStacksNamespaces(proposal, stacksAddresses);

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
    
    try {
      // Pair with WalletConnect - this will show the QR code modal
      const { uri } = await walletKit.pair();
      
      // The modal with QR code should appear automatically
      // User can scan with their wallet or copy the URI
      console.log('Pairing URI:', uri);
    } catch (error) {
      console.error('Pairing error:', error);
      setIsConnecting(false);
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

  if (currentSession && address) {
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
