import { defineChain } from 'viem'
 
export const baseSepolia = defineChain({
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        'https://sepolia.base.org',
        'https://base-sepolia.drpc.org',
        'https://base-sepolia-rpc.publicnode.com'
        ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://base-sepolia.blockscout.com',
      apiUrl: 'https://base-sepolia.blockscout.com/api',
    },
  },
  testnet: true,
})