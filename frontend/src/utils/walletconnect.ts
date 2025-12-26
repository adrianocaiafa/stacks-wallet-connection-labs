import { Core } from "@walletconnect/core";
import { SignClient } from "@walletconnect/sign-client";
import { buildApprovedNamespaces } from "@walletconnect/utils";
import { STACKS_MAINNET, STACKS_TESTNET, STACKS_SIGNING_METHODS, STACKS_EVENTS } from "../data/StacksData";

// Get project ID from environment
const PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'a01e2f3b960c64bb5d3b7f6f8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8';

// Singleton instances
let coreInstance: Core | null = null;
let signClientInstance: SignClient | null = null;

// Get or create Core instance (singleton)
function getCore(): Core {
  if (!coreInstance) {
    coreInstance = new Core({
      projectId: PROJECT_ID,
    });
  }
  return coreInstance;
}

// Initialize SignClient (singleton)
export async function initSignClient(): Promise<SignClient> {
  if (signClientInstance) {
    return signClientInstance;
  }

  const core = getCore();

  signClientInstance = await SignClient.init({
    core,
    metadata: {
      name: "Stacks Portal",
      description: "Portal para interagir com contratos Clarity na rede Stacks",
      url: window.location.origin,
      icons: [`${window.location.origin}/vite.svg`],
    },
  });

  return signClientInstance;
}

export function getSignClient(): SignClient | null {
  return signClientInstance;
}

// Build approved namespaces for Stacks
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

