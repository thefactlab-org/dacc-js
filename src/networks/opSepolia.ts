import { defineChain } from 'viem'
 
export const opSepolia = defineChain({
  id: 11155420,
  name: 'OP Sepolia',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        'https://sepolia.optimism.io',
        'https://optimism-sepolia.drpc.org'
        ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://testnet-explorer.optimism.io/',
      apiUrl: 'https://testnet-explorer.optimism.io/api',
    },
  },
  testnet: true,
})