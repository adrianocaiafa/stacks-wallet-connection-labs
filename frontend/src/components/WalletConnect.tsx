import { useState, useEffect } from 'react';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { getSdkError } from '@walletconnect/utils';
import { buildStacksNamespaces } from '../utils/walletconnect';
import { QRCodeSVG } from 'qrcode.react';

export function WalletConnect() {
  const { signClient, isInitialized, sessions, address } = useWalletConnect();
  const [showModal, setShowModal] = useState(false);
  const [wcUri, setWcUri] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const currentSession = sessions.length > 0 ? sessions[0] : null;

  useEffect(() => {
    if (!signClient || !isInitialized) return;

    // Handle session proposal approval
    const handleSessionProposal = async (proposal: any) => {
      try {
        // For now, we'll use a placeholder address
        // In production, you would get this from the connected wallet
        const stacksAddresses = ['ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM']; // Placeholder
        
        const approvedNamespaces = buildStacksNamespaces(proposal, stacksAddresses);

        const session = await signClient.approve({
          id: proposal.id,
          namespaces: approvedNamespaces,
        });

        console.log('Session approved:', session);
        setShowModal(false);
        setWcUri(null);
        setIsConnecting(false);
      } catch (error) {
        console.error('Session approval error:', error);
        await signClient.reject({
          id: proposal.id,
          reason: getSdkError('USER_REJECTED'),
        });
        setIsConnecting(false);
      }
    };

    signClient.on('session_proposal', handleSessionProposal);

    return () => {
      signClient.off('session_proposal', handleSessionProposal);
    };
  }, [signClient, isInitialized]);

  const handleConnect = async () => {
    if (!signClient || !isInitialized) {
      alert('WalletConnect não está inicializado.');
      return;
    }

    setShowModal(true);
    setIsConnecting(true);

    try {
      // Create a pairing proposal
      const { uri } = await signClient.connect({
        requiredNamespaces: {
          stacks: {
            chains: ['stacks:1', 'stacks:2147483648'],
            methods: ['stx_signTransaction', 'stx_signMessage'],
            events: ['stacks_accountsChanged', 'stacks_chainChanged'],
          },
        },
      });

      if (uri) {
        setWcUri(uri);
      }
    } catch (error) {
      console.error('Connection error:', error);
      setShowModal(false);
      setWcUri(null);
      setIsConnecting(false);
    }
  };

  const handleCopyLink = () => {
    if (wcUri) {
      navigator.clipboard.writeText(wcUri);
      // You could add a toast notification here
    }
  };

  const handleDisconnect = async () => {
    if (!signClient || !currentSession) return;

    try {
      await signClient.disconnect({
        topic: currentSession.topic,
        reason: getSdkError('USER_DISCONNECTED'),
      });
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
    <>
      <button
        onClick={handleConnect}
        disabled={!isInitialized}
        className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
      >
        Connect Wallet
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-100 rounded-2xl p-8 max-w-md w-full mx-4 relative">
            {/* Close button */}
            <button
              onClick={() => {
                setShowModal(false);
                setWcUri(null);
                setIsConnecting(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>

            {/* Title */}
            <h3 className="text-2xl font-semibold text-gray-900 text-center mb-6">WalletConnect</h3>

            {/* QR Code */}
            {wcUri ? (
              <div className="flex flex-col items-center space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <QRCodeSVG 
                    value={wcUri} 
                    size={280}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                
                {/* Instructions */}
                <p className="text-sm text-gray-600 text-center">
                  Scan this QR Code with your phone
                </p>

                {/* Copy link button */}
                <button
                  onClick={handleCopyLink}
                  className="px-6 py-3 border-2 border-gray-300 bg-white rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy link
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center text-xs text-gray-500">
              UX by . / reown
            </div>
          </div>
        </div>
      )}
    </>
  );
}
