import { defineChain } from 'viem'
 
export const sepolia = defineChain({
  id: 11155111,
  name: 'Sepolia',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        'https://sepolia.drpc.org',
        'https://1rpc.io/sepolia',
        'https://ethereum-sepolia-rpc.publicnode.com'
        ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://eth-sepolia.blockscout.com',
      apiUrl: 'https://eth-sepolia.blockscout.com/api',
    },
  },
  testnet: true,
})