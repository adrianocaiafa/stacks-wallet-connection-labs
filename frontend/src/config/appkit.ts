import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet } from '@reown/appkit/networks'
import { createConfig, http } from 'wagmi'

// Get project ID from environment
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '818bdad25c702392f94804d469abc4c7'

// Create Wagmi config
const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
})

// Create Wagmi Adapter
// The networks are inferred from wagmiConfig.chains
const wagmiAdapter = new WagmiAdapter({
  wagmiConfig,
  projectId,
})

// Create AppKit instance
// This will automatically detect injected providers (like Leather) and WalletConnect
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet],
  projectId,
  metadata: {
    name: 'Stacks Portal',
    description: 'Portal para interagir com contratos Clarity na rede Stacks',
    url: window.location.origin,
    icons: [`${window.location.origin}/vite.svg`],
  },
  features: {
    analytics: true,
  },
  // Enable both WalletConnect and injected providers
  enableEIP6963: true, // Auto-detect injected wallets
  enableCoinbase: true,
  enableWalletConnect: true,
})

