// Stacks blockchain configuration for WalletConnect
export const STACKS_MAINNET = 'stacks:1'
export const STACKS_TESTNET = 'stacks:2147483648'

export const STACKS_CHAINS = {
  [STACKS_MAINNET]: {
    chainId: '1',
    name: 'Stacks Mainnet',
    currency: 'STX',
    explorerUrl: 'https://explorer.stacks.co',
    rpcUrl: 'https://api.stacks.co'
  },
  [STACKS_TESTNET]: {
    chainId: '2147483648',
    name: 'Stacks Testnet',
    currency: 'STX',
    explorerUrl: 'https://explorer.stacks.co/?chain=testnet',
    rpcUrl: 'https://api.testnet.stacks.co'
  }
}

export const STACKS_SIGNING_METHODS = {
  STX_SIGN_TRANSACTION: 'stx_signTransaction',
  STX_SIGN_MESSAGE: 'stx_signMessage'
}

export const STACKS_EVENTS = {
  ACCOUNTS_CHANGED: 'stacks_accountsChanged',
  CHAIN_CHANGED: 'stacks_chainChanged'
}

