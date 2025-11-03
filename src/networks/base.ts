import { defineChain } from 'viem'
 
export const base = defineChain({
  id: 8453,
  name: 'Base',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        'https://mainnet.base.org',
        'https://base.drpc.org',
        'https://1rpc.io/base'
        ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://base.blockscout.com/',
      apiUrl: 'https://base.blockscout.com/api',
    },
  },
})