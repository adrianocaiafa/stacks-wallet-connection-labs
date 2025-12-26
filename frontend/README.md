# Frontend - Stacks Portal

Portal React para interagir com contratos Clarity na rede Stacks usando WalletKit SDK.

## Configuração

### WalletConnect Project ID

1. Acesse [WalletConnect Dashboard](https://dashboard.walletconnect.com)
2. Crie um novo projeto
3. Copie o Project ID
4. Crie um arquivo `.env` na raiz do frontend:

```env
VITE_WALLETCONNECT_PROJECT_ID=seu_project_id_aqui
```

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Notas

- O WalletKit SDK está configurado para conectar a wallets via WalletConnect
- Para Stacks blockchain, certifique-se de que a wallet suporta WalletConnect
- A assinatura de transações será implementada via session requests do WalletKit
