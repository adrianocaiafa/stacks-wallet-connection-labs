import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  const handleConnect = () => {
    // #region agent log
    // Log Hypothesis C, D: Check providers at the moment of clicking connect
    fetch('http://127.0.0.1:7244/ingest/c3e6add3-dca9-424c-86cf-86619854abaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WalletConnect.tsx:11',message:'Connect button clicked',data:{hasLeatherProvider:!!((window as any).LeatherProvider),hasStacksProvider:!!((window as any).StacksProvider),hasBtc:!!((window as any).btc),hasEthereum:!!((window as any).ethereum),leatherKeys:Object.keys((window as any).LeatherProvider||{})},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C,D'})}).catch(()=>{});
    // #endregion
    
    // AppKit will automatically show:
    // 1. Injected wallets (like Leather) if available
    // 2. WalletConnect QR code option
    open();
    
    // #region agent log
    // Log Hypothesis E: Check after open() is called
    setTimeout(()=>{
      fetch('http://127.0.0.1:7244/ingest/c3e6add3-dca9-424c-86cf-86619854abaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WalletConnect.tsx:24',message:'After appkit.open() called',data:{modalOpened:true},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'E'})}).catch(()=>{});
    },100);
    // #endregion
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
