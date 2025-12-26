import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet } from '@reown/appkit/networks'

// Get project ID from environment
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'a01e2f3b960c64bb5d3b7f6f8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8'

// Create a metadata object - this will be shown in the wallet selection UI
const metadata = {
  name: 'Stacks Portal',
  description: 'Portal para interagir com contratos Clarity na rede Stacks',
  url: window.location.origin,
  icons: [`${window.location.origin}/vite.svg`]
}

// Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet],
  projectId
})

// Create AppKit instance - this will show the wallet selection modal automatically
// when you call appKit.open() or use the useAppKit hook
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet],
  projectId,
  metadata,
  features: {
    analytics: true,
  },
})

