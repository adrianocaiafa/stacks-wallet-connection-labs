import { Core } from "@walletconnect/core";
import { WalletKit } from "@reown/walletkit";

// Get project ID from environment or use a default for development
// IMPORTANT: Get your Project ID from https://dashboard.walletconnect.com
const PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'a01e2f3b960c64bb5d3b7f6f8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8';

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

