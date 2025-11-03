import { defineChain } from 'viem'
 
export const bnbTestnet = defineChain({
  id: 97,
  name: 'BNB Smart Chain Testnet',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        'https://data-seed-prebsc-1-s1.bnbchain.org:8545',
        'https://bsc-testnet.drpc.org',
        'https://bsc-testnet-rpc.publicnode.com'
        ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://testnet.bscscan.com/',
      apiUrl: 'https://testnet.bscscan.com/api',
    },
  },
  testnet: true,
})