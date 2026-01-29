import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet } from '@reown/appkit/networks'

// Get project ID from environment
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '818bdad25c702392f94804d469abc4c7'

// Create Wagmi Adapter with networks
// The WagmiAdapter will create its own wagmiConfig internally
const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet],
  projectId,
})

// Export wagmiConfig for use in WagmiProvider
export const wagmiConfig = wagmiAdapter.wagmiConfig

// Create AppKit instance
// Note: This is kept for potential future Ethereum integration
// Currently using @stacks/connect for Stacks/Bitcoin wallet connections
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

