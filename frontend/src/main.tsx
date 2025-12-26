import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { appKit } from './config/appkit'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient()

// Get wagmiConfig from the adapter
const wagmiConfig = appKit.wagmiAdapter.wagmiConfig

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
