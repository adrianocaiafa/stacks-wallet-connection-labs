import { useState, useEffect } from 'react';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { getSdkError } from '@walletconnect/utils';
import { buildStacksNamespaces } from '../utils/walletconnect';
import { QRCodeSVG } from 'qrcode.react';

// Wallet metadata for display
const WALLETS = [
  { id: 'walletconnect', name: 'WalletConnect', icon: '🔗' },
  { id: 'metamask', name: 'MetaMask', icon: '🦊' },
  { id: 'trust', name: 'Trust Wallet', icon: '🛡️' },
  { id: 'coinbase', name: 'Coinbase', icon: '🔵' },
  { id: 'rainbow', name: 'Rainbow', icon: '🌈' },
  { id: 'phantom', name: 'Phantom', icon: '👻' },
];

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

  const handleWalletClick = async (walletId: string) => {
    // For now, all wallets use the same connection flow
    // In production, you might want to handle different wallets differently
    await handleConnect();
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
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">Conectar Carteira</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setWcUri(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            {wcUri ? (
              // Show QR code when URI is available
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
              </div>
            ) : (
              // Show wallet buttons
              <div>
                <p className="text-gray-600 mb-4 text-center">
                  Escolha uma carteira para conectar
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {WALLETS.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => handleWalletClick(wallet.id)}
                      disabled={isConnecting}
                      className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition disabled:opacity-50"
                    >
                      <span className="text-3xl mb-2">{wallet.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{wallet.name}</span>
                    </button>
                  ))}
                </div>
                {isConnecting && (
                  <div className="mt-4 text-center text-gray-600">
                    Conectando...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
