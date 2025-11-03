import { defineChain } from 'viem'
 
export const bnb = defineChain({
  id: 56,
  name: 'BNB Smart Chain',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        'https://bsc.drpc.org',
        'https://1rpc.io/bnb',
        'https://bsc-dataseed.bnbchain.org'
        ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://bscscan.com/',
      apiUrl: 'https://bscscan.com/api',
    },
  },
})