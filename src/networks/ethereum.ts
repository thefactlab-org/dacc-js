import { defineChain } from 'viem'
 
export const ethereum = defineChain({
  id: 1,
  name: 'Ethereum Mainnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        'https://eth.drpc.org',
        'https://1rpc.io/eth',
        'https://eth-mainnet.public.blastapi.io'
        ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://etherscan.io',
      apiUrl: 'https://api.etherscan.io/api',
    },
  },
})