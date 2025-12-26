import { useState, useEffect } from 'react';
import { useWalletKit } from '../hooks/useWalletKit';
import { getSdkError } from '@walletconnect/utils';
import { buildApprovedNamespaces } from '@walletconnect/utils';
import { QRCodeSVG } from 'qrcode.react';

export function WalletConnect() {
  const { walletKit, isInitialized, sessions } = useWalletKit();
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [wcUri, setWcUri] = useState<string | null>(null);

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
    
    // Check for URI in query params (when redirected from wallet)
    const urlParams = new URLSearchParams(window.location.search);
    const uri = urlParams.get('uri');
    
    if (uri) {
      try {
        await walletKit.pair({ uri });
        setIsConnecting(false);
      } catch (error) {
        console.error('Pairing error:', error);
        setIsConnecting(false);
      }
    } else {
      // Generate pairing URI and show QR code
      try {
        const { uri: pairingUri } = await walletKit.pair();
        setWcUri(pairingUri);
        setShowQRModal(true);
        setIsConnecting(false);
      } catch (error) {
        console.error('Error generating pairing URI:', error);
        setIsConnecting(false);
      }
    }
  };

  const handleCloseModal = () => {
    setShowQRModal(false);
    setWcUri(null);
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
    <>
      <button
        onClick={handleConnect}
        disabled={isConnecting || !isInitialized}
        className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
      >
        {!isInitialized ? 'Loading...' : isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {showQRModal && wcUri && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Conectar Carteira</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <QRCodeSVG value={wcUri} size={256} />
              </div>
              
              <p className="text-sm text-gray-600 text-center">
                Escaneie este QR code com sua carteira Stacks compatível com WalletConnect
              </p>
              
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ou cole o URI manualmente:
                </label>
                <textarea
                  value={wcUri}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono"
                  rows={3}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              </div>
              
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

