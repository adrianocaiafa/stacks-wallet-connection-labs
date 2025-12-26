import { Core } from "@walletconnect/core";
import { WalletKit } from "@reown/walletkit";
import { buildApprovedNamespaces } from "@walletconnect/utils";
import { STACKS_CHAINS, STACKS_SIGNING_METHODS, STACKS_EVENTS, STACKS_MAINNET, STACKS_TESTNET } from "../data/StacksData";

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

// Build approved namespaces for Stacks
// Based on the example from reown-com/web-examples
export function buildStacksNamespaces(proposal: any, stacksAddresses: string[]) {
  const supportedNamespaces = {
    stacks: {
      chains: [STACKS_MAINNET, STACKS_TESTNET],
      methods: Object.values(STACKS_SIGNING_METHODS),
      events: Object.values(STACKS_EVENTS),
      accounts: [
        ...stacksAddresses.map(addr => `${STACKS_MAINNET}:${addr}`),
        ...stacksAddresses.map(addr => `${STACKS_TESTNET}:${addr}`)
      ]
    }
  };

  try {
    const approvedNamespaces = buildApprovedNamespaces({
      proposal: proposal.params,
      supportedNamespaces
    });

    return approvedNamespaces;
  } catch (error) {
    console.error('Error building approved namespaces:', error);
    // Fallback: return a basic namespace structure
    return {
      stacks: {
        chains: [STACKS_MAINNET, STACKS_TESTNET],
        methods: Object.values(STACKS_SIGNING_METHODS),
        events: Object.values(STACKS_EVENTS),
        accounts: [
          ...stacksAddresses.map(addr => `${STACKS_MAINNET}:${addr}`),
          ...stacksAddresses.map(addr => `${STACKS_TESTNET}:${addr}`)
        ]
      }
    };
  }
}
