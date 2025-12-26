import { Core } from "@walletconnect/core";
import { WalletKit } from "@reown/walletkit";

// Get project ID from environment or use a default for development
const PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

let walletKitInstance: WalletKit | null = null;

export async function initWalletKit(): Promise<WalletKit> {
  if (walletKitInstance) {
    return walletKitInstance;
  }

  const core = new Core({
    projectId: PROJECT_ID,
  });

  walletKitInstance = await WalletKit.init({
    core,
    metadata: {
      name: "Stacks Portal",
      description: "Portal para interagir com contratos Clarity na rede Stacks",
      url: window.location.origin,
      icons: [`${window.location.origin}/vite.svg`],
    },
  });

  return walletKitInstance;
}

export function getWalletKit(): WalletKit | null {
  return walletKitInstance;
}

