import { useAccount, useDisconnect, useConnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  const handleConnect = () => {
    open();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  if (isConnected && address) {
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

