import { defineChain } from 'viem'
 
export const optimism = defineChain({
  id: 10,
  name: 'Optimism Mainnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        'https://mainnet.optimism.io',
        'https://optimism.drpc.org',
        'https://1rpc.io/op'
        ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://explorer.optimism.io/',
      apiUrl: 'https://explorer.optimism.io/api',
    },
  },
})